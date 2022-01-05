/* Settings */
INSERT INTO public."settings" ("botMasterId", "minCncPoints", "cncRulesMessageId") 
     VALUES ('105547568519327744', 10, '914761500277768202');

/* Named Channels */
INSERT INTO public."namedChannels" ("channelId", "shortName")
VALUES
  ('576537775105507330', 'general'),
  ('760224827503149098', 'critique'),
  ('576672844851707905', 'points')
;

INSERT INTO public."ranks" ("minPoints", "name")
VALUES
  (5, 'Dip ''N Forget'),
  (10, 'Ebay Propainted'),
  (20, 'C+C Plz'),
  (40, 'JALMM'),
  (70, 'Bub For The Bub Glub'),
  (110, 'SPANISH WIZARD'),
  (160, 'Resin Renegade'),
  (220, 'Fartis Dopus'),
  (290, '50 Shades of Leather'),
  (370, 'Terrainosaurus'),
  (460, 'Backlog Butcher'),
  (560, 'Onion Knight'),
  (1000, 'Hack Fraud')
;
