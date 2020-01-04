ispell-lt
=========

You are looking at the dictionaries and affix files for spellchecking
of Lithuanian texts.

The latest version of the affix tables and dictionaries can be found
at ftp://ftp.akl.lt/ispell-lt/ .  The mailing list of the project is
available at https://lists.akl.lt/mailman/listinfo/ispell-lt .  A
browsable web interface to the project CVS repository is available at
http://sraige.mif.vu.lt/cvs/ispell-lt/

The software is available under the provisions of a BSD-style license.
The full text of the license is available in the COPYING file.

The project has been sponsored by the Information Society Development
Committee of the Government of Republic of Lithuania.

Albertas Agejevas <alga@akl.lt>
31-December-2003


Add this line to "dictionary.lst" when OOo nor Quickstarter are NOT executing:
DICT lt LT lt_LT



		Lietuvi k  MySpell afiks  lenteli  diegimo instrukcijos

		Ram nas Luka evi ius (Ramunas.Lukasevicius@mail.lt)
		Albertas Agejevas (alga@akl.lt)

	1.   anga
	2. Lenteli   diegimas   Mozill 
	3. Lenteli   diegimas   OpenOffice



	1.   anga

 is failas skirtas apra ymams kaip vienoje ar kitoje operacin je
sistemoje tam tikroms programoms  diegti afiks  lenteles kad tikrint 
lietuvi  kalbos ra yb .

 emiau pateikti apra ymai yra skirti  iek tiek pa engusiems
vartotojams.  Ateityje b t  galima sukurti kok  skript , palengvinant 
 diegim .

	2. Lenteli   diegimas   Mozilla

Standartiniame Mozillos  diegime iki versijos 1.5 n ra  diegiamas
ra ybos tikrinimo komponentas, tod l reikia j  papildomai atsisi sti
ir  sidiegti i  interneto adresu
http://spellchecker.mozdev.org/installation.html  diegus    paket ,
ra ant lai k , ar kuriant puslap , meniu turi atsirasti mygtukas
"spell".  Mozilla 1.5 ir v lesnioms versijoms atskirai ra ybos
tikrinimo paketo diegti nereikia, pakanka tik  diegti  odyn  ir
lenteles.

Diegiant afiks  lenteles u tenka nukopijuoti lt_LT.dic ir lt_LT.aff
bylas   $mozilla/components/myspell katalog .   ia $mozilla yra
Mozilla  diegimo katalogas, pvz. Windows platformoje 
"C:\Program Files\mozilla.org\Mozilla", o Linux platformoje
/usr/lib/mozilla.

	3. Lenteli   diegimas   OpenOffice

 emiau pateiktos instrukcijos, kaip  diegti  odyn    OpenOffice.org
versijas 641C, 1.0 ir v lesnius:

1) prie  pradedant  diegim , reikia u daryti visus OpenOffice langus,
   netgi Quickstarter.

2) nukopijuojame lt_LT.dic, lt_LT.aff, ir dictionary.lst  
   $OpenOffice/user/wordbook/  ia $OpenOffice yra OpenOffice.org
    diegimo katalogas, pvz. Windows platformoje "C:\Program
   Files\OpenOffice.org.1.1.0\", o Linux platformoje
   ~/.openoffice/1.1.0/.

3) Dabar paleid iame OpenOffice ir vykdom tokias komandas:
   Tools->Options->LanguageSettings->WritingAids
   Paspaud iame Edit (prie Available language modules), pasirenkame
   lietuvi  kalb  ir pa ymime "OpenOffice MySpell spell checker".

4) Dabar pasirenkame Tools->Options->LanguageSettings->Languages ir
   pasirenkame Lietuvi k  lokal , bei nustatome lietuvi  kalb  kaip
   nutylim j  dokumentams lotyni komis raid mis (ties "Western").

 odynas  diegtas ir u registruotas   OpenOffice.

Apie  diegim  galima pasiskaityti ir adresu
http://whiteboard.openoffice.org/lingucomponent/download_dictionary.html#installspell


