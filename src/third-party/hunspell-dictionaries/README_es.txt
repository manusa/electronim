mod.20050307,rh. Thanks to Enrique Latre for 240 words added to list
mod.20050118,rh. Thanks to Santiago Bosio for the "escribir" flag correction
mod.20040626,rh. Thanks to Claudio Valderrama for correcting oversight of Chile
mod.20031230,rh. Adding words to dict
mod.20031024,rh. Adjusting affix file
mod.20031012,rh. Corrected REP list count
mod.20031006,rh. Corrected TRY string, add REP list, more proper nouns
Releashed:20020501,rh.
======================================================
This dictionary is based on the Spanish wordlist and affixes created
by Jesus Carretero and Santiago Rodriguez, June 2001 V1.7 and is
covered by their original Gnu GPL license as published by the FSF,
published at ftp://ftp.fi.upm.es/pub/unix/espa~nol.tar.gz .

All modification to the affix file and wordlist to make compatible
with MySpell are copyright 2002 Richard Holt, rholt@telcel.net.ve and
covered by the same Gnu GPL license as the original work.

Thanks to Santiago Rodriguez for his assistance in converting to MySpell.
----------------
Este diccionario esta basada en la lista de palabras y afijos creado
por Jes s Carretero y Santiago Rodriguez, Junio 2001 V1.7 y esta
cubierto por su licencia original, Gnu GPL como publicado por el FSF.
publicado en ftp://ftp.fi.upm.es/pub/unix/espa~nol.tar.gz .

Los modificaciones al fichero de afijos y lista de palabras para hacerlo
compatible con MySpell son copyright 2002 Richard Holt, rholt@telcel.net.ve
y cubierto por el mismo licencia Gnu GPL que el trabajo original.

Gracias a Santiago Rodriguez para su asistencia en la conversi n a MySpell.
****************************************************************************
												INSTALACI N

			 Instalaci n manual para diccionario Espa ol para
    OpenOffice.org (OOo100) y (OOo101) para Linux y Windows

Notas:
   Las referencias est n basadas en OOo100/101 en Espa ol.
   Se asume que OOorg est  instalado correctamente.
   El diccionario es lo mismo para Linux y Windows
   Cierre el OOorg y el Quickstarter antes de continuar

1. Descomprima el diccionario, *.zip o *.tgz a un directorio temporal.
Copie dictionary.lst (si no existe), es_ES.aff y es_ES.dic al directorio
seg n su sistema operativo y la versi n de Ooorg:

c:\Programas\OOo10x\user\wordbook\
o
/home/OOo10x/user/wordbook/

   ** En OOo101, es posible para el administrador instalar diccionarios
   adicionales a <-net Install>\OOo101\share\dict\ooo\ que quedar 
   disponible para activaci n en todos usuarios. Los usuarios, siempre
   puedan a adir diccionarios a su \user\wordbook.

2.Edite "dictionary.lst" en este directorio con un editor de texto.
Para registrar un idioma espec fico, o m ltiples, agregue l neas
como, por ejemplo, lo siguiente a "dictionary.lst":

#
DICT es VE es_ES
HYPH es VE hyph_es_ES


3.Ahora, arranque OOorg. Si estaba ejecutando el programa mientras
hac a lo anterior, cierre todas las ventanas, el Quickstarter
y rehaga el paso n mero 2 de arriba en el "dictionary.lst".

4.Configuraci n de Idiomas:
Clic en Herramientas|Opciones|Configuraci n de idioma|Idiomas
Seleccione Idioma Predeterminado a "Espa ol (Espa a)" o la suya.
Clic en Herramientas|Opciones|Configuraci n de idioma|Ling  stica

En Editar M dulos disponibles de idioma, en la secci n Idioma
seleccione Espa ol (Espa a) y
marcar "[x] OpenOffice MySpell SpellChecker" para cada idioma
instalado con el fin de activarlo.

Oprima Cerrar.
Seleccione Aceptar para guardar sus cambios y
salir de Configuraci n de idioma.

   Listo! Su diccionario est  instalado y registrado para ese idioma.
Si sigue con problemas, lea otra vez las instrucciones.  Esto ocurre
muy frecuentemente porque OOorg estaba activo cuando modifica el
dictionary.lst
Si todavia tienes problemas, escr bame a users@es.openoffice.org


P. D.: Si desea crear un diccionario para su zona o pa s solamente
tiene que hacer lo siguiente:

Asignarlo en el dictionary.lst. Solamente asigna los locales que
actualmente necesitas por que se ocupan memoria RAM.

 	DICT es AR es_ES
 	DICT es BO es_ES
 	DICT es BZ es_ES
 	DICT es CO es_ES
 	DICT es CL es_ES
 	DICT es CR es_ES
 	DICT es CU es_ES
 	DICT es DO es_ES
 	DICT es EC es_ES
 	DICT es SV es_ES
 	DICT es GU es_ES
 	DICT es HN es_ES
 	DICT es MX es_ES
 	DICT es NI es_ES
 	DICT es PA es_ES
 	DICT es PY es_ES
 	DICT es PE es_ES
 	DICT es PR es_ES
 	DICT es ES es_ES
 	DICT es UY es_ES
 	DICT es VE es_ES
****************************************************************************
Los siguientes son disponibles:
es,AR,es_ES,Espa ol (Argentina),es_ES.zip
es,BZ,es_ES,Espa ol (Belize),es_ES.zip
es,BO,es_ES,Espa ol (Bolivia),es_ES.zip
es,CL,es_ES,Espa ol (Chile),es_ES.zip
es,CO,es_ES,Espa ol (Colombia),es_ES.zip
es,CR,es_ES,Espa ol (Costa Rica),es_ES.zip
es,CU,es_ES,Espa ol (Cuba),es_ES.zip
es,DO,es_ES,Espa ol (Dominican Republic),es_ES.zip
es,EC,es_ES,Espa ol (Ecuador),es_ES.zip
es,SV,es_ES,Espa ol (El Salvador),es_ES.zip
es,GU,es_ES,Espa ol (Guatemala),es_ES.zip
es,HN,es_ES,Espa ol (Honduras),es_ES.zip
es,MX,es_MX,Espa ol (Mexico),es_MX.zip
es,NI,es_ES,Espa ol (Nicaragua),es_ES.zip
es,PA,es_ES,Espa ol (Panama),es_ES.zip
es,PY,es_ES,Espa ol (Paraguay),es_ES.zip
es,PE,es_ES,Espa ol (Peru),es_ES.zip
es,PR,es_ES,Espa ol (Puerto Rico),es_ES.zip
es,ES,es_ES,Espa ol (Spain),es_ES.zip
es,UY,es_ES,Espa ol (Uruguay),es_ES.zip
es,VE,es_ES,Espa ol (Venezuela),es_ES.zip
y
por separado, tambien:
ca,ES,ca_ES,Catalan (Spain),ca_ES.zip
gl,ES,gl_ES,Galician (Spain),gl_ES.zip

					Example of "dictionary.lst"

# List of All Dictionaries to be Loaded by OpenOffice
# ---------------------------------------------------
# Each Entry in the list have the following space delimited fields
#
# Field 1: Entry Type "DICT" - spellchecking dictionary
#                     "HYPH" - hyphenation dictionary
#
# Field 2: Language code from Locale "en" or "de" or "pt" ...
#
# Field 3: Country Code from Locale "US" or "GB" or "PT"
#
# Field 4: Root name of file(s) "en_US" or "hyph_de"
#          (do not add extensions to the name)

DICT es ES es_ES
DICT es VE es_ES
HYPH es ES hyph_es_ES
HYPH es VE hyph_es_ES
