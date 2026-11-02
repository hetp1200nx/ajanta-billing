-- =====================================================================
--  AJANTA PAVER – import customers, products and terms from the old
--  Quotation Maker app (taken from the screen recordings, 03-Nov-2026).
--  Safe to run more than once: rows are matched by name and updated,
--  never duplicated. The test entries named "sample" are skipped.
-- =====================================================================

-- ---------- Customers -------------------------------------------------
drop table if exists _p;
create temp table _p (name text, contact_person text, phone text, email text, address text,
  shipping_address text, state_code text, gstin text, is_customer boolean, is_vendor boolean, notes text);

insert into _p values
 ('PURUSHADANIYA PARAS ENTERPRISE','NIKET SHAH',null,null,
  E'9th Floor, P 901, Amber Heights, Gotri GERI Bansal Road,\nVadodara, Gujarat, 390021',
  E'9th Floor, P 901, Amber Heights, Gotri GERI Bansal Road, Vadodara, Vadodara, Gujarat, 390021','24','24CHYPS8856H1Z9',true,false,null),
 ('Integrity Infrabuild Developers Ltd.','Akshat Shah','7069759849',null,
  E'Indiabulls Megamall, T-02, Jetalpur Rd, Anand Nagar,\nAkota, Vadodara, Gujarat 390007',
  E'Indiabulls Megamall, T-02, Jetalpur Rd, Anand Nagar, Akota, Vadodara, Gujarat 390007','24','24AAHCI7013H1ZS',true,false,null),
 ('DREAMS INFRA',null,'9825067183',null,
  E'Chalali Chokadi, Vejalpur - 389340,\nTa. Kalol, Dist. Panchmahal',
  E'Chalali Chokadi, Vejalpur - 389340\nTa. Kalol, Dist. Panchmahal','24',null,true,false,null),
 ('Mustak Bhai',null,null,null,'ShahiBaug, Ahmedabad','ShahiBaug, Ahmedabad','24',null,true,false,null),
 ('Hyden Engineering Company','Karan Chaudhary','+916353650507',null,
  E'Second Floor, 364, Kot Faliyu,\nTadav Toad, Vyara, Tapi Gujarat, 394650',
  E'Second Floor, 364, Kot Faliyu,\nTadav Toad, Vyara, Tapi Gujarat, 394650','24','24AANFH1154K1ZC',true,false,null),
 ('TECH IRON Engineering services','Ganesh Sir','+919890083931','techiron916@gmail.com',
  E'Shop No-10, Vrundavan co.op.soc, koparli road,\nchharwada, vapi, Gujarat-396191',
  E'Shop No-10, Vrundavan co.op.soc, koparli road, chharwada, vapi, Gujarat-396191','24','24MHMPS9784G1Z8',true,false,null),
 ('AMBIKA STEEL AND CEMENT',null,'8000090085',null,
  E'68, Yogeshwar Township No.2,\nAjwa Road, Vadodara-390019',
  'Ex Factory (Ajanta Paver)','24','24AAUFA3553C1ZM',true,false,null),
 ('DINESH STEEL AND ALLOYS','Lokesh Soni','9714441905',null,
  E'238A, New Lehripura, Gendigate Road\nVadodara, Gujarat, 390001',null,'24','24AYLPM3961D1ZF',true,true,null),
 ('HK ENTERPRISES','MD Khan','9999438141',null,
  E'Bichondia Mohalla Ghasera, Near Jama Masjid, BUS STOP 161,\nVillage Ghasera, Nuh, Haryana, 122107',null,'06','06BMZPH5239L1ZB',true,false,null),
 ('Universal Trading Company','Anant Patel','+919898880053',null,
  E'B-65 HAPPY HOMES BANGLOW\nNR ARCHITECTURE COLLAGE BILL - BHAYLI ROAD BILL',
  E'B-65 HAPPY HOMES BANGLOW NR ARCHITECTURE COLLAGE BILL - BHAYLI ROAD BILL','24','24AAGFU4147G1Z8',true,false,null),
 ('WASIM FASTNER','Mustafa bhai','+918828072230','wasimfastner@gmail.com',
  E'Shop No. 58/A, Chota Sonapur, Trimbak Parshuram Street,\nNear Anjuman High School, Mumbai Central (E), Mumbai - 400008',
  E'Shop No. 58/A, Chota Sonapur, Trimbak Parshuram Street, Near Anjuman High School, Mumbai Central (E), Mumbai - 400008','27','27BNQPM5493M1ZZ',true,false,null),
 ('GUPTA CONSTRUCTION','SUDHIRBHAI HARIBABU GUPTA',null,null,
  E'E5, GUPTA CONSTRUCTION, MODINAGAR HANSOT ROAD,\nANKLESHWAR, Bharuch, Gujarat, 393001',
  'TP4 , FP93 near Badiyadev Temple, Bhaili , Vadodara, 391410','24','24ACRPG1020B1ZE',true,false,null),
 ('Ace Mica Pvt. Ltd.',null,null,null,
  E'Plot no. 72/b Sampa village, Behind Indian Oil petrol pump,\nOpp. Mosumpur bus stand, Bayad road, Dehgam',
  E'Plot no. 72/b Sampa village\nBehind Indian Oil petrol pump\nOpp. Mosumpur bus stand\nBayad road, Dehgam','24',null,true,false,null),
 ('Tanshihbhai',null,null,null,'marogar wagodiya vadodara',null,'24',null,true,false,null),
 ('KALA ENTERPRISE','KAUSHIKKUMAR PARMAR',null,null,
  E'B 63, NILESH NAGAR SOCEITY, KARODIYA ROAD,\nGORWA, Vadodara, Gujarat, 390016',
  E'B 63, NILESH NAGAR SOCEITY, KARODIYA ROAD,\nGORWA, Vadodara, Gujarat, 390016','24','24ASUPP3892M1ZQ',true,false,null),
 ('SHIV ENTERPRISE','Himanshu Kalola','+919429815626',null,
  '602/SHIV ENCLAVE,KAPURAI,VADODARA','602/SHIV ENCLAVE,KAPURAI,VADODARA','24','24HZNPK1452D2ZF',true,false,'Cement');

update parties p set
  contact_person = coalesce(n.contact_person, p.contact_person), phone = coalesce(n.phone, p.phone),
  email = coalesce(n.email, p.email), address = n.address, shipping_address = coalesce(n.shipping_address, p.shipping_address),
  state_code = n.state_code, gstin = coalesce(n.gstin, p.gstin), is_customer = n.is_customer or p.is_customer,
  is_vendor = n.is_vendor or p.is_vendor, notes = coalesce(n.notes, p.notes), updated_at = now()
from _p n where lower(p.name) = lower(n.name);

insert into parties (name, contact_person, phone, email, address, shipping_address, state_code, gstin, is_customer, is_vendor, notes)
select n.name, n.contact_person, n.phone, n.email, n.address, n.shipping_address, n.state_code, n.gstin, n.is_customer, n.is_vendor, n.notes
from _p n where not exists (select 1 from parties p where lower(p.name) = lower(n.name));

-- ---------- Products --------------------------------------------------
drop table if exists _pr;
create temp table _pr (name text, description text, hsn text, unit text, rate numeric, tax_rate numeric);

insert into _pr values
 ('Paver Block 60mm', null, '68101110', 'Foot', 35, 18),
 ('Areca Nuts', '50KG/Bag', '080280', 'Kg', 350, 5),
 ('U Support Clamps', null, null, 'Nos', 100, 18),
 ('Black Foam Sheet', E'40 mm x 1200 mm x 2400 mm\nBlack colour', '3921', 'Sheet', 2500, 18),
 ('SS304 Stud M10 1mtr Long', null, '73181500', 'Nos', 180, 18),
 ('Gi Electroplating coated Chemical Anchor 20X400 with M20 Nut & Washer',
   'Gi Electroplating coated Chemical Anchor 20X400 with M20 Nut & Washer', '73181500', 'Nos', 350, 18),
 ('SS304 Mechanical Anchor 12X100 Imported', 'SS304 Mechanical anchor with nut and washer.', null, 'Nos', 39, 18),
 ('Karb Stone 300X300X80', 'Includes Loading-Unloading and Fitting.', '68101110', 'Nos', 50, 18),
 ('ZigZag Design Paver Block', 'Thickness 80mm, Grade M40', '68101110', 'Sqft', 43, 18),
 ('Uni Paver Block', E'80 mm Thickness,\nIncludes Loading-Unloading and Fitting.', '68101110', 'Sqft', 2800, 18),
 ('OPC 53 GRADE CEMENT', null, null, null, 28.36, 18);

update products p set description = coalesce(n.description, p.description), hsn = coalesce(n.hsn, p.hsn),
  unit = coalesce(n.unit, p.unit), rate = n.rate, tax_rate = n.tax_rate
from _pr n where lower(p.name) = lower(n.name);

insert into products (name, description, hsn, unit, rate, tax_rate)
select n.name, n.description, n.hsn, n.unit, n.rate, n.tax_rate
from _pr n where not exists (select 1 from products p where lower(p.name) = lower(n.name));

-- ---------- Terms & conditions (replaces the 2 starter terms) ---------
-- Quotation-only terms are offered on quotations; shared ones on quotations
-- and invoices. Only "Transport" is added automatically to new quotations.
delete from terms where content in (
  '30% Advance, 70% on Delivery.',
  'Transport, Loading & Unloading included.',
  'Payment: 25% Advance, 75% on Delivery.',
  'Material delivery 1 week after order confirmation.',
  'Payment Condition: 10% Advance on order confirmation, rest on delivery.',
  'Joints Fitting Material (Cement) Extra',
  'E-signature is not required for computer generated invoice.',
  'This order is under (CGST)',
  'This order is under (IGST)',
  E'Payment Conditions: 100% Advance\nFirst Delivery will be of quantity of 200 nos');

insert into terms (scope, title, content, auto, sort) values
 ('sales', 'Transport',           'Transport, Loading & Unloading included.',                            '["quote"]'::jsonb, 1),
 ('sales', 'Payment (Quotation)', 'Payment: 25% Advance, 75% on Delivery.',                              '[]'::jsonb, 2),
 ('sales', 'Delivery',            'Material delivery 1 week after order confirmation.',                  '[]'::jsonb, 3),
 ('sales', 'Payment Condition',   'Payment Condition: 10% Advance on order confirmation, rest on delivery.', '[]'::jsonb, 4),
 ('sales', 'Joints Fitting',      'Joints Fitting Material (Cement) Extra',                              '[]'::jsonb, 5),
 ('sales', 'E-signature',         'E-signature is not required for computer generated invoice.',         '[]'::jsonb, 6),
 ('purchase', 'CGST',             'This order is under (CGST)',                                          '[]'::jsonb, 1),
 ('purchase', 'IGST',             'This order is under (IGST)',                                          '[]'::jsonb, 2),
 ('purchase', 'Payment Conditions', E'Payment Conditions: 100% Advance\nFirst Delivery will be of quantity of 200 nos', '[]'::jsonb, 3);

drop table if exists _p;
drop table if exists _pr;

-- ---------- Check ------------------------------------------------------
select (select count(*) from parties) as customers_vendors,
       (select count(*) from products) as products,
       (select count(*) from terms) as terms;
