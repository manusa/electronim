README_pt_BR

:: PORTUGU S ::
Este dicion rio   baseado na vers o ispell do dicion rio de Portugu s e no script "conjugue" de Ricardo Ueda Karpischek mailto:ueda@ime.usp.br ambos dispon veis em http://www.ime.usp.br/~ueda/br.ispell/ e est o cobertos, no original, pela licen a vers o 2 da Licen a P blica Geral da Funda  o para o Software Livre (FSF GPL).

Todas as modifica  es   lista de palavras e ao arquivo affix que permitem que o original, supra referido, funcionem com MySpell foram feitas por Augusto Tavares Rosa Marcacini mailto:amarcacini@adv.oabsp.org.br e est o cobertas pela mesma vers o 2 da Licen a P blica Geral da Funda  o para o Software Livre (FSF GPL).



:: ENGLISH ::
This dictionary is based on a ispell version of the Portuguese dictionary and the "conjugue" script created by Ricardo Ueda Karpischek mailto:ueda@ime.usp.br both available in http://www.ime.usp.br/~ueda/br.ispell/ and thus are covered by his original Free Software Foundation (FSF)  GPL version 2 license.

All modifications to the affix file and wordlist to make it work with MySpell were done by Augusto Tavares Rosa Marcacini mailto:amarcacini@adv.oabsp.org.br and covered by the same GPL version 2 license.


::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
PARA INSTALAR O CORRETOR BRASILEIRO NO OPENOFFICE:
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

Copie os arquivos pt_BR.dic e pt_BR.aff para o diret rio <OpenOffice.org>/user/wordbook/, onde <OpenOffice.org>   o diret rio em que o programa foi instalado.

No mesmo diret rio, localize o arquivo dictionary.lst. Abra-o com um editor de textos e acrescente a seguinte linha ao final:

DICT pt BR pt_BR

  necess rio reiniciar o OpenOffice, inclusive o in cio r pido da vers o para Windows que fica na barra de tarefas. Ap s,   necess rio ativar a corre  o em portugu s brasileiro. Ver em Ferramentas->Op  es->Configura  o da L ngua->Lingu stica->Editar.

Tamb m ser  necess rio configurar a l ngua do seu texto, na mesma janela de formata  o dos caracteres, em Formatar->Caracteres.   poss vel alterar o padr o (at  que seja distribu da uma vers o do OpenOffice em portugu s brasileiro) em Ferramentas->Op  es->Configura  o da L ngua->L nguas, para que todos os novos documentos se iniciem automaticamente em portugu s brasileiro.

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
HIST RICO
::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

*** Vers o 06.08.2002 ***

Segunda vers o. Cont m 25165 palavras no arquivo pt_BR.dic. V rias palavras estavam duplicadas na primeira vers o, por isso o n mero diminuiu...

J  s o 2960 verbos conjugados, dos 4100 presentes no dicion rio. Em rela  o   vers o anterior, foram acrescentados quase dois mil verbos regulares da primeira conjuga  o. Estou no momento fazendo a parte mais f cil,   claro! :-) 

Corrigido bug no arquivo pt_BR.aff: uma letra trocada, que era "tolerada" na vers o 1.0.0 do OpenOffice, causa erro fatal na vers o 1.0.1, provocando o fechamento do editor de textos.

*** Vers o 03.07.2002 ***

Primeira vers o. Cont m 25210 palavras no arquivo pt_BR.dic.

Este dicion rio foi elaborado a partir da lista de palavras da vers o brasileira do ispell e do conjugador de verbos conjugue, ambos de Ricardo Ueda Karpischek mailto:ueda@ime.usp.br. Palavras novas foram acrescentadas, muitas delas do jarg o jur dico.

O arquivo affix (pt_br.aff) foi adaptado para funcionar com o MySpell (OpenOffice.org), criando-se v rias extens es novas.

A rela  o de palavras deve cobrir boa parte do vocabul rio mais usual. Certamente h  muito o que ser acrescentado. H  cerca de 4100 verbos no infinitivo, dos quais apenas 1009 est o conjugados. 

A grande maioria dos verbos n o conjugados deve ser regular, de modo que basta acrescentar "/R" ap s a palavra (no arquivo pt_BR.dic) para que todas as variantes sejam acrescidas. Em todo caso,   necess rio verificar um a um quais verbos s o regulares (tomar cuidado com acentua  o e cedilhas, que fazem com que verbos regulares tenham que ser tratados de modo pr prio) e quais s o irregulares.

No caso dos verbos irregulares, alguns talvez se encaixem nos padr es j  definidos no arquivo affix; para outros, ser  necess rio criar novas extens es. Na pr xima vers o devem ser inclu das novas extens es para mais alguns padr es de verbos irregulares.

