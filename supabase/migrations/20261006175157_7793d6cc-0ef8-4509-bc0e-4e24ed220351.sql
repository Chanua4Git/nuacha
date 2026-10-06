WITH rows(d,place,descr,amt,cat,rec) AS (VALUES
('2026-07-31','APPLE.COM/BILL','Apple subscription',29.13,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-31','AMAZON PRIME Amzn.com/bill','Amazon Prime',102.59,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-31','LOVABLE LOVABLE.DEV','Lovable subscription',175.50,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-31','RBC Visa','NSF penalty fee',35.00,'7669ce63-ae76-44f1-9ceb-e70a5f31d96b',false),
('2026-07-24','CYRUS ROAD GAS CORNER HIGHWA','Fuel',286.68,'65913142-c280-4caa-861f-32721a79e708',false),
('2026-07-23','PEAKE TRADING 177 WESTERN M','Peake Trading',1031.10,'0c5274f7-2d3e-4f9d-9347-0216c637dae1',false),
('2026-07-20','APPLE.COM/BILL','Apple subscription',274.03,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-20','APPLE.COM/BILL','Apple subscription',487.22,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-20','LOVABLE LOVABLE.DEV','Lovable subscription',169.56,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-20','LOVABLE LOVABLE.DEV','Lovable subscription',374.88,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-14','SUPERPHARM LIMITED COUVA','Superpharm',779.00,'28ed4803-4ee5-4eee-abec-d4095f2ed417',false),
('2026-07-13','LOVABLE LOVABLE.DEV','Lovable subscription',188.06,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-13','WATER AND SEWERAGE AUT VALSAYN','WASA water bill',216.00,'e0ce45f7-37df-46cc-952f-0d9d1070ab94',true),
('2026-07-13','FLOW PORT OF SPAIN','Flow bill',395.19,'78fdba66-7a40-4125-8a5d-0dd93168bb11',true),
('2026-07-10','MEDFORD AT BREN EDINBURGH BOU','Medford at Bren',275.39,'0c5274f7-2d3e-4f9d-9347-0216c637dae1',false),
('2026-07-06','ELEVENLABS.IO','ElevenLabs subscription',149.24,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-06','AMAZON PRIME Amzn.com/bill','Amazon Prime',102.84,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-03','APPLE.COM/BILL','Apple subscription',155.68,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-03','APPLE.COM BILL','Apple subscription',202.83,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-03','PRD TRADING LTD 97A OLD SOUTH','PRD Trading',268.62,'adf31dd6-0fa8-4f6d-9996-0d6c694be250',false),
('2026-07-02','LOVABLE LOVABLE.DEV','Lovable subscription',169.08,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-02','LOVABLE LOVABLE.DEV','Lovable subscription',175.50,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-02','LOVABLE LOVABLE.DEV','Lovable subscription',186.93,'752fca36-ec59-4ff4-9ff5-b7bc618ae477',true),
('2026-07-01','RBC Visa','NSF penalty fee',35.00,'7669ce63-ae76-44f1-9ceb-e70a5f31d96b',false)
), ins AS (
  INSERT INTO public.expenses (family_id,amount,description,category,date,place,payment_method,tags,expense_type)
  SELECT 'dae2bdc4-5736-46ea-93e1-c1d977257dc8',amt,descr,cat,d,place,'credit_card',
    CASE WHEN rec THEN ARRAY['visa-1704','recurring'] ELSE ARRAY['visa-1704'] END,'actual' FROM rows
  RETURNING id, amount
)
INSERT INTO public.money_allocations (user_id,account_id,expense_id,amount,notes)
SELECT '27182ba6-fe5d-431e-9302-c0c7e71597c0','824311a6-d678-4f92-9709-fb5572ebed65',id,amount,'Visa 1704' FROM ins;

UPDATE public.money_accounts SET known_balance = -26020.54, known_balance_date = '2026-10-06'
WHERE id='824311a6-d678-4f92-9709-fb5572ebed65' AND known_balance < 0;