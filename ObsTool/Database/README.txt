=====================================================
Database modifications
=====================================================

-- Fixing the Sh2 catalog names, they were without space
-- --------------------------------------------------------
update SacDeepSkyObjects
set Catalog = 'Sh2', Catalog_number = substring(name, 5, 100)
where name like 'Sh2-%';


-- Making the Messier number the primary, and the NGC the secondary number
-- --------------------------------------------------------
-- Changing this:
-- 
-- Catalog  Catalog_number  Name      Other_names
-- NGC      205             NGC 205   M 110
--   
-- to this:
-- 
-- Catalog  Catalog_number  Name      Other_names
-- M        110             M 110     NGC 205
-- 

-- Other_names -> Catalog and Catalog_number
update [ObsTool].[dbo].[SacDeepSkyObjects]
set Catalog = 'M', Catalog_number = substring(Other_names, 3, 100)
where Other_names like '[M][ ][0-9]%';

-- Name -> Other_names
update [ObsTool].[dbo].[SacDeepSkyObjects]
set Other_names = Name
where Catalog = 'M';

-- Catalog and Catalog_number -> Name
update [ObsTool].[dbo].[SacDeepSkyObjects]
set Name = concat(Catalog, ' ', Catalog_number)
where Catalog = 'M';


-- Adding common names
-- --------------------------------------------------------

-- Ex
-- IC 3568 has four names, the primary is the first from the Stellarium database, Lemon slice nebula
-- The docs says its the last but the app shows the first, which is probably correct.
select *
from StellariumCommonNames 
where name = 'IC 3568';

-- Selecting
select sac.Common_name, sac.All_common_names, sac.Catalog, sac.Catalog_number,sac.name, sac.Other_names, stellarium.name as stel_name, stellarium.Common_name as common_name, allnames.all_common_names
from SacDeepSkyObjects sac
inner join StellariumCommonNames stellarium on 
	sac.Other_names = stellarium.Name or 
	sac.Name = concat(stellarium.catalog, '-', stellarium.Catalog_number) or 
	sac.Name = stellarium.name
inner join (
	select name, string_agg([Common_name], ', ') as all_common_names
	from [StellariumCommonNames] 
	group by Name) allnames on
	stellarium.name = allnames.name
inner join (select min(Id) as Id from StellariumCommonNames group by Name) stellarium_primary on
	stellarium.Id = stellarium_primary.Id
where sac.name = 'IC 3568';

-- Updating
update sac
set sac.Common_name = stellarium.common_name,
    sac.All_common_names = allnames.all_common_names
from SacDeepSkyObjects sac
inner join StellariumCommonNames stellarium on 
	sac.Other_names = stellarium.Name or 
	sac.Name = concat(stellarium.catalog, '-', stellarium.Catalog_number) or 
	sac.Name = stellarium.name
inner join (
	select name, string_agg([Common_name], ', ') as all_common_names
	from [StellariumCommonNames] 
	group by Name) allnames on
	stellarium.name = allnames.name
inner join (select min(Id) as Id from StellariumCommonNames group by Name) stellarium_primary on
	stellarium.Id = stellarium_primary.Id;


-- Adding a 'custom' object at Id 0
-- -------------------------------------------------
SET Identity_insert dbo.SacDeepSkyObjects ON
GO
INSERT INTO [dbo].[SacDeepSkyObjects]
           ([Id]
           ,[Catalog]
           ,[Catalog_number]
           ,[Name]
           ,[Other_names]
           ,[Common_name]
           ,[All_common_names]
           ,[Type]
           ,[Con]
           ,[RA]
           ,[DEC]
           ,[Mag]
           ,[SB]
           ,[U2K]
           ,[TI]
           ,[Size_max]
           ,[Size_min]
           ,[PA]
           ,[Class]
           ,[NSTS]
           ,[BRSTR]
           ,[BCHM]
           ,[Dreyer_desc]
           ,[Notes])
     VALUES
           (0
           ,''
           ,NULL
           ,'custom'
           ,NULL
           ,NULL
           ,NULL
           ,''
           ,''
           ,''
           ,''
           ,''
           ,''
           ,''
           ,''
           ,NULL
           ,NULL
           ,NULL
           ,NULL
           ,NULL
           ,NULL
           ,NULL
           ,NULL
           ,NULL)
GO
SET Identity_insert dbo.SacDeepSkyObjects OFF
GO

