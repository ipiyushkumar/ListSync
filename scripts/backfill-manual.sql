-- Backfill externalId + externalSource for anime entries missing them
-- Using AniList IDs manually looked up

-- Am I actually the strongest? → AniList 154391
UPDATE Media SET externalId='154391', externalSource='anilist', title='Am I Actually the Strongest?' WHERE title='Am I actually the strongest?' AND category='anime';

-- Black Bullet → AniList 20457
UPDATE Media SET externalId='20457', externalSource='anilist' WHERE title='Black Bullet' AND category='anime';

-- Black Torch → AniList 187538
UPDATE Media SET externalId='187538', externalSource='anilist', title='BLACK TORCH' WHERE title='Black Torch' AND category='anime';

-- Claymore → AniList 1818
UPDATE Media SET externalId='1818', externalSource='anilist', title='CLAYMORE' WHERE title='Claymore' AND category='anime';

-- Dara-san of Reiwa → AniList 203880
UPDATE Media SET externalId='203880', externalSource='anilist', title='Dara-san of the Reiwa Era' WHERE title='Dara-san of Reiwa' AND category='anime';

-- Durarara!! → AniList 6746
UPDATE Media SET externalId='6746', externalSource='anilist' WHERE title='Durarara!!' AND category='anime';

-- Helck → AniList 145140
UPDATE Media SET externalId='145140', externalSource='anilist' WHERE title='Helck' AND category='anime';

-- Hell Mode → AniList 185262
UPDATE Media SET externalId='185262', externalSource='anilist', title='HELL MODE' WHERE title='Hell Mode' AND category='anime';

-- How a realist hero built the kingdom → AniList 117612
UPDATE Media SET externalId='117612', externalSource='anilist', title='How a Realist Hero Rebuilt the Kingdom' WHERE title='How a realist hero built the kingdom' AND category='anime';

-- I am quitting heroing → AniList 140457
UPDATE Media SET externalId='140457', externalSource='anilist', title="I'm Quitting Heroing" WHERE title='I am quitting heroing' AND category='anime';

-- KamiKatsu: Working for God in a Godless World → AniList 148048
UPDATE Media SET externalId='148048', externalSource='anilist', title='KamiKatsu' WHERE title='KamiKatsu: Working for God in a Godless World' AND category='anime';

-- Mob Psycho 100 → AniList 21507
UPDATE Media SET externalId='21507', externalSource='anilist' WHERE title='Mob Psycho 100' AND category='anime';

-- My Isekai Life → AniList 129192
UPDATE Media SET externalId='129192', externalSource='anilist', title='My Isekai Life' WHERE title='My Isekai Life: I Gained a Second Character Class and Became the Strongest Sage in the World' AND category='anime';

-- Orient → AniList 128034
UPDATE Media SET externalId='128034', externalSource='anilist', title='ORIENT' WHERE title='Orient' AND category='anime';

-- Overlord → AniList 20832
UPDATE Media SET externalId='20832', externalSource='anilist' WHERE title='Overlord' AND category='anime';

-- Parallel world pharmacy Season 1 → AniList 136707
UPDATE Media SET externalId='136707', externalSource='anilist', title='Parallel World Pharmacy' WHERE title='Parallel world pharmacy Season 1' AND category='anime';

-- Sentenced to Be a Hero → AniList 167152
UPDATE Media SET externalId='167152', externalSource='anilist' WHERE title='Sentenced to Be a Hero' AND category='anime';

-- Solo leveling → AniList 151807
UPDATE Media SET externalId='151807', externalSource='anilist', title='Solo Leveling' WHERE title='Solo leveling' AND category='anime';

-- The Aristocrat's Otherworldly Adventure → AniList 153332
UPDATE Media SET externalId='153332', externalSource='anilist', title='The Aristocrat''s Otherworldly Adventure' WHERE title='The Aristocrat''s Otherworldly Adventure: Serving Gods Who Go Too Far' AND category='anime';

-- Vermeil in Gold → AniList 146210
UPDATE Media SET externalId='146210', externalSource='anilist', title='Vermeil in Gold' WHERE title='Vermeil in Gold' AND category='anime';

-- NOTE: These 4 titles were NOT FOUND on AniList:
-- Comartie high school
-- Jack of all trades, party of none
-- The boring hero reincarnated with dragon using a katana
-- The trash world with gloves
-- Uncle from Another World (Isekai Ojisan)
