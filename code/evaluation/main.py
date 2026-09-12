import os
import re
import math
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def load_data():
    profiles = pd.read_csv('dataset/financial_profiles.csv').set_index('user_id')
    events = pd.read_csv('dataset/financial_events.csv')
    options = pd.read_csv('dataset/request_payment_options.csv')
    rates = pd.read_csv('dataset/exchange_rates.csv')
    messages = pd.read_csv('dataset/messages.csv')
    requests = pd.read_csv('dataset/requests.csv')
    samples = pd.read_csv('dataset/sample_requests.csv')
    
    # Image extracted amounts
    image_amounts = {
        'event_253': 4365000.0,
        'event_1442': 100000.0,
        'event_1545': 41272.0,
        'event_1700': 2854.0,
        'event_1786': 704.05,
        'event_3051': 1995.0,
        'event_3231': 8528.0,
        'event_4535': 15339.0,
        'event_5170': 723.0,
        'event_6033': 79679.26,
        'event_6859': 3650.0,
        'event_7307': 33.50,
        'event_7941': 2298.0,
        'event_9421': 4543.0,
        'event_9806': 9968.0,
        'event_10521': 393.22,
    }
    for eid, amt in image_amounts.items():
        events.loc[events['event_id'] == eid, 'amount'] = amt

    return profiles, events, options, rates, messages, requests, samples

def parse_date(d_str):
    if pd.isna(d_str) or not d_str:
        return None
    return datetime.strptime(str(d_str)[:10], '%Y-%m-%d')

def format_date(dt):
    if dt is None:
        return ""
    return dt.strftime('%Y-%m-%d')

def format_curr(amt, curr):
    if curr in ['IDR', 'INR', 'ZAR']:
        if abs(amt - round(amt)) < 1e-4:
            return f"{curr} {int(round(amt)):,}"
        return f"{curr} {amt:,.2f}"
    else:
        return f"{curr} {amt:,.2f}"

def format_plan_amt(amt):
    if abs(amt - round(amt)) < 1e-4:
        return f"{int(round(amt))}"
    elif abs(amt * 10 - round(amt * 10)) < 1e-4:
        return f"{amt:.1f}"
    else:
        return f"{amt:.2f}"

def run_solver():
    profiles, events, options, rates, messages, requests, samples = load_data()
    
    # Process employer messages for salary overrides or dates
    salary_overrides = {}
    for _, msg in messages.iterrows():
        txt = str(msg['message_text'])
        uid = msg['user_id']
        # Check salary amount override
        # e.g. "Gaji bulanan Anda naik menjadi IDR 42750000" or "temporary monthly pay is EUR 1037.52"
        # or "next salary is reduced to EUR 1422.85"
        amt_match = re.search(r'(?:menjadi|pay is|reduced to|adalah)\s+(?:IDR|EUR|USD|ZAR|INR)\s+([0-9.,]+)', txt, re.IGNORECASE)
        date_match = re.search(r'(?:mulai|expected on)\s+([0-9]{4}-[0-9]{2}-[0-9]{2})', txt, re.IGNORECASE)
        
        if uid not in salary_overrides:
            salary_overrides[uid] = {}
        if amt_match:
            val_str = amt_match.group(1).replace(',', '').rstrip('.')
            salary_overrides[uid]['amount'] = float(val_str)
        if date_match:
            salary_overrides[uid]['date'] = date_match.group(1)

    print(f"Parsed {len(salary_overrides)} salary message overrides.")

    # Process all evaluation requests
    results = []
    
    for _, req in requests.iterrows():
        req_id = req['request_id']
        uid = req['user_id']
        req_date = parse_date(req['request_date'])
        req_amt = float(req['requested_amount'])
        comp_date = parse_date(req['desired_completion_date'])
        allows_partial = str(req['allows_partial_payment']).lower() == 'true'
        
        prof = profiles.loc[uid]
        curr = prof['home_currency']
        avail_bal = float(prof['current_available_balance'])
        min_bal = float(prof['minimum_balance_to_keep'])
        max_inst_months = prof['max_installment_months']
        max_inst = int(max_inst_months) if pd.notna(max_inst_months) and str(max_inst_months).strip() != '' else 0
        methods_allowed = [m.strip() for m in str(prof['payment_methods_user_will_consider']).split('|')]
        
        willing_stop = [c.strip() for c in str(prof['expense_categories_user_is_willing_to_stop']).split('|') if pd.notna(prof['expense_categories_user_is_willing_to_stop']) and c.strip()]
        willing_reduce = [c.strip() for c in str(prof['expense_categories_user_is_willing_to_reduce']).split('|') if pd.notna(prof['expense_categories_user_is_willing_to_reduce']) and c.strip()]
        
        # User events
        ue = events[events['user_id'] == uid].copy()
        
        # Identify recurring monthly expenses and next confirmed salary
        # 1. Salary
        sal_events = ue[(ue['category'] == 'salary') & (ue['status'].isin(['scheduled', 'settled']))].sort_values('settlement_date')
        # Check if message override exists
        salary_amt = None
        salary_day = 15 # default
        if len(sal_events) > 0:
            last_sal = sal_events.iloc[-1]
            salary_amt = float(last_sal['amount'])
            if pd.notna(last_sal['settlement_date']):
                salary_day = int(str(last_sal['settlement_date'])[-2:])
        
        if uid in salary_overrides:
            if 'amount' in salary_overrides[uid]:
                salary_amt = salary_overrides[uid]['amount']
            if 'date' in salary_overrides[uid]:
                salary_day = int(salary_overrides[uid]['date'][-2:])

        # 2. Recurring monthly expenses
        # Group by category and description
        recurring_expenses = []
        for cat, group in ue.groupby('category'):
            if cat in ['salary', 'investment', 'refund', 'other_income']:
                continue
            debits = group[group['direction'] == 'debit']
            if len(debits) >= 2:
                # check mean amount and typical day
                avg_amt = debits['amount'].median()
                dates = [parse_date(d) for d in debits['settlement_date'] if pd.notna(d)]
                if dates:
                    day_of_month = int(np.median([d.day for d in dates]))
                    # check flexibility
                    flex = debits.iloc[-1]['flexibility'] if 'flexibility' in debits.columns else 'fixed'
                    eid = debits.iloc[-1]['event_id']
                    min_allowed = debits.iloc[-1]['minimum_allowed_amount']
                    recurring_expenses.append({
                        'category': cat,
                        'amount': avg_amt,
                        'day': day_of_month,
                        'flexibility': flex,
                        'event_id': eid,
                        'min_allowed': float(min_allowed) if pd.notna(min_allowed) else avg_amt
                    })

        # 3. Pending debits already in flight
        pending_debits = ue[(ue['status'] == 'pending') & (ue['direction'] == 'debit')]
        pending_total = pending_debits['amount'].sum() if len(pending_debits) > 0 else 0.0

        # Simulate 90-day cash flow baseline starting from req_date
        def simulate_balances(spending_mod=None):
            daily_balances = {}
            current = avail_bal - pending_total
            dt = req_date
            
            # Apply spending mods if any
            active_recurring = []
            for r in recurring_expenses:
                cat = r['category']
                amt = r['amount']
                if spending_mod:
                    if spending_mod.get('stop') == r['event_id']:
                        continue
                    if spending_mod.get('reduce_id') == r['event_id']:
                        amt = spending_mod.get('reduce_amt', amt)
                active_recurring.append((r['day'], amt, cat))

            for day_idx in range(91):
                cur_date = req_date + timedelta(days=day_idx)
                # Income
                if cur_date.day == salary_day and salary_amt is not None and day_idx > 0:
                    current += salary_amt
                # Expenses
                for exp_day, exp_amt, _ in active_recurring:
                    if cur_date.day == exp_day and day_idx > 0:
                        current -= exp_amt
                daily_balances[cur_date] = current
            return daily_balances

        base_balances = simulate_balances()
        min_base = min(base_balances.values())
        
        # Safe to pay today before optional spending changes
        # Max amount payable today such that balance never drops below min_bal
        safe_today = max(0.0, min_base - min_bal)
        safe_today = min(req_amt, safe_today)
        # Round sensibly to 2 decimals
        safe_today = round(safe_today, 2)
        if curr in ['IDR', 'INR', 'ZAR'] and safe_today > 100:
            # check if integer or exact
            if abs(safe_today - round(safe_today)) < 1e-3:
                safe_today = float(round(safe_today))

        # Earliest date for full payment
        # First date d in [req_date, req_date+90] where paying req_amt on d leaves future balance >= min_bal
        earliest_full_date = None
        for day_idx in range(91):
            cand_date = req_date + timedelta(days=day_idx)
            # check if paying req_amt on cand_date keeps all subsequent days >= min_bal
            feasible = True
            for future_day in range(day_idx, 91):
                f_date = req_date + timedelta(days=future_day)
                if base_balances[f_date] - req_amt < min_bal - 1e-4:
                    feasible = False
                    break
            if feasible:
                earliest_full_date = cand_date
                break

        # Candidate plans
        req_options = options[options['request_id'] == req_id].sort_values('payment_option_id')
        
        status = "not_affordable"
        method = "not_recommended"
        plan = "none"
        spending_changes = "none"
        explanation = ""

        # Check 1: Affordable Now (full payment today safe and accepted)
        if safe_today >= req_amt - 1e-4 and 'full_payment' in methods_allowed:
            status = "affordable_now"
            method = "full_payment"
            plan = f"{format_date(req_date)}:{format_plan_amt(req_amt)}"
            earliest_full_date = req_date
            spending_changes = "none"
            explanation = f"Pay {format_curr(req_amt, curr)} today. This leaves at least {format_curr(min_bal, curr)} available over the next 90 days."

        else:
            # Check Plans: Installments, Partial Payment, Spending Changes, or Wait
            best_plan = None
            # Ranking criteria:
            # 1. Complete by desired_completion_date
            # 2. Require no spending changes
            # 3. Minimize total amount paid
            # 4. Start payment earlier
            # 5. Fewer payments
            # 6. Lowest payment_option_id

            candidates = []

            # A. Installment options from request_payment_options.csv
            if 'installments' in methods_allowed:
                for _, opt in req_options.iterrows():
                    if opt['payment_method'] == 'installments':
                        num_p = int(opt['number_of_payments'])
                        if max_inst > 0 and num_p > max_inst:
                            continue
                        p_amt = float(opt['payment_amount'])
                        p_first = parse_date(opt['first_payment_date'])
                        freq = int(opt['payment_frequency_days']) if pd.notna(opt['payment_frequency_days']) else 30
                        tot_payable = float(opt['total_payable_amount'])
                        
                        # Generate payment schedule
                        p_dates = [p_first + timedelta(days=j * freq) for j in range(num_p)]
                        last_date = p_dates[-1]
                        
                        # Check cash-flow feasibility
                        inst_feasible = True
                        for j, p_dt in enumerate(p_dates):
                            # check balance on and after p_dt
                            # find cumulative installments up to day
                            pass
                        
                        # Simulate balance with installments
                        inst_balances = dict(base_balances)
                        for p_dt in p_dates:
                            for b_dt in inst_balances:
                                if b_dt >= p_dt:
                                    inst_balances[b_dt] -= p_amt
                        
                        if min(inst_balances.values()) >= min_bal - 1e-4:
                            plan_str = "|".join([f"{format_date(p_dt)}:{format_plan_amt(p_amt)}" for p_dt in p_dates])
                            completes_on_time = (comp_date is None) or (last_date <= comp_date)
                            candidates.append({
                                'method': 'installments',
                                'status': 'affordable_with_plan',
                                'plan': plan_str,
                                'changes': 'none',
                                'total_cost': tot_payable,
                                'start_date': p_first,
                                'num_payments': num_p,
                                'completes_on_time': completes_on_time,
                                'option_id': opt['payment_option_id'],
                                'explanation': f"Use {num_p} installments of {format_curr(p_amt, curr)}, starting {p_first.strftime('%d %B %Y').lstrip('0')}. This leaves at least {format_curr(min_bal, curr)} available."
                            })

            # B. Partial Payment
            if 'partial_payment' in methods_allowed and allows_partial and safe_today > 0 and safe_today < req_amt:
                if earliest_full_date and comp_date and earliest_full_date <= comp_date:
                    rem_amt = round(req_amt - safe_today, 2)
                    plan_str = f"{format_date(req_date)}:{format_plan_amt(safe_today)}|{format_date(earliest_full_date)}:{format_plan_amt(rem_amt)}"
                    candidates.append({
                        'method': 'partial_payment',
                        'status': 'affordable_with_plan',
                        'plan': plan_str,
                        'changes': 'none',
                        'total_cost': req_amt,
                        'start_date': req_date,
                        'num_payments': 2,
                        'completes_on_time': True,
                        'option_id': 'partial',
                        'explanation': f"Pay {format_curr(safe_today, curr)} today and {format_curr(rem_amt, curr)} on {earliest_full_date.strftime('%d %B %Y').lstrip('0')}. This maintains the {format_curr(min_bal, curr)} reserve."
                    })

            # C. Spending Changes (Stop or Reduce flexible expenses)
            # Check if stopping or reducing brings safe_today >= req_amt
            if candidates == [] and 'full_payment' in methods_allowed:
                for r in recurring_expenses:
                    cat = r['category']
                    if cat in willing_stop:
                        # try stop
                        mod = {'stop': r['event_id']}
                        mod_bal = simulate_balances(mod)
                        if min(mod_bal.values()) - req_amt >= min_bal - 1e-4:
                            candidates.append({
                                'method': 'full_payment',
                                'status': 'affordable_with_plan',
                                'plan': f"{format_date(req_date)}:{format_plan_amt(req_amt)}",
                                'changes': f"stop:{r['event_id']}",
                                'total_cost': req_amt,
                                'start_date': req_date,
                                'num_payments': 1,
                                'completes_on_time': True,
                                'option_id': 'spending_mod',
                                'explanation': f"Stop the {r['category']} subscription, then pay {format_curr(req_amt, curr)} today. This leaves at least {format_curr(min_bal, curr)} available."
                            })
                            break
                    elif cat in willing_reduce:
                        # try reduce
                        red_amt = r['min_allowed']
                        mod = {'reduce_id': r['event_id'], 'reduce_amt': red_amt}
                        mod_bal = simulate_balances(mod)
                        if min(mod_bal.values()) - req_amt >= min_bal - 1e-4:
                            candidates.append({
                                'method': 'full_payment',
                                'status': 'affordable_with_plan',
                                'plan': f"{format_date(req_date)}:{format_plan_amt(req_amt)}",
                                'changes': f"reduce_to:{r['event_id']}:{format_plan_amt(red_amt)}",
                                'total_cost': req_amt,
                                'start_date': req_date,
                                'num_payments': 1,
                                'completes_on_time': True,
                                'option_id': 'spending_mod',
                                'explanation': f"Reduce {r['category']} expenses to {format_curr(red_amt, curr)}, then pay {format_curr(req_amt, curr)} today. This keeps the {format_curr(min_bal, curr)} balance safe."
                            })
                            break

            # D. Wait (if earliest_full_date exists and <= comp_date)
            if 'full_payment' in methods_allowed and earliest_full_date is not None:
                completes_on_time = (comp_date is None) or (earliest_full_date <= comp_date)
                candidates.append({
                    'method': 'wait',
                    'status': 'affordable_later',
                    'plan': f"{format_date(earliest_full_date)}:{format_plan_amt(req_amt)}",
                    'changes': 'none',
                    'total_cost': req_amt,
                    'start_date': earliest_full_date,
                    'num_payments': 1,
                    'completes_on_time': completes_on_time,
                    'option_id': 'wait',
                    'explanation': f"Wait until {earliest_full_date.strftime('%d %B %Y').lstrip('0')}, then pay {format_curr(req_amt, curr)} in full. Paying earlier would take the balance below the {format_curr(min_bal, curr)} minimum."
                })

            # Sort candidates by the 6 rules
            if candidates:
                def sort_key(c):
                    # 1. On time (True first -> 0, False -> 1)
                    r1 = 0 if c['completes_on_time'] else 1
                    # 2. No spending changes (none -> 0, else -> 1)
                    r2 = 0 if c['changes'] == 'none' else 1
                    # 3. Minimize total amount paid
                    r3 = c['total_cost']
                    # 4. Start earlier
                    r4 = c['start_date']
                    # 5. Fewer payments
                    r5 = c['num_payments']
                    # 6. Option ID
                    r6 = str(c['option_id'])
                    return (r1, r2, r3, r4, r5, r6)

                candidates.sort(key=sort_key)
                best = candidates[0]
                
                # If best candidate does not complete on time and is not affordable later, fallback
                if not best['completes_on_time'] and best['method'] != 'wait':
                    status = "not_affordable"
                    method = "not_recommended"
                    plan = "none"
                    spending_changes = "none"
                    deadline_str = comp_date.strftime('%d %B %Y').lstrip('0') if comp_date else "the deadline"
                    explanation = f"Do not make this payment by {deadline_str}. None of the available options keeps the {format_curr(min_bal, curr)} minimum protected."
                else:
                    status = best['status']
                    method = best['method']
                    plan = best['plan']
                    spending_changes = best['changes']
                    explanation = best['explanation']
            else:
                status = "not_affordable"
                method = "not_recommended"
                plan = "none"
                spending_changes = "none"
                deadline_str = comp_date.strftime('%d %B %Y').lstrip('0') if comp_date else "the deadline"
                explanation = f"Do not make this payment by {deadline_str}. None of the available options keeps the {format_curr(min_bal, curr)} minimum protected."

        # Format earliest date
        earliest_str = format_date(earliest_full_date) if (earliest_full_date and status != "not_affordable") else ""
        if status == "affordable_now":
            earliest_str = format_date(req_date)

        results.append({
            'request_id': req_id,
            'amount_safe_to_pay': safe_today,
            'affordability_status': status,
            'recommended_payment_method': method,
            'payment_plan': plan,
            'earliest_date_for_full_payment': earliest_str,
            'spending_changes_needed': spending_changes,
            'decision_explanation': explanation
        })

    out_df = pd.DataFrame(results)
    out_df.to_csv('output.csv', index=False)
    print(f"Successfully generated output.csv with {len(out_df)} rows.")

if __name__ == '__main__':
    run_solver()
