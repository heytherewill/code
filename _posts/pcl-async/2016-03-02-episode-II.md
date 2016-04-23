---
layout: post
tagline: "await willsb.PreparePCLAsync();"
category: "xamarin"
title: "Episódio II - A importância de usar async"
series: "pcl-async"
tags : [pcl, async, xamarin]
---
{% include JB/setup %}

![Cover](/assets/covers/pclasync.png)

### Episódio II - A importância de usar async

Na episódio passado, falamos sobre PCLs e seus usos para o desenvolvimento cross mobile. Elas são uteis pois aumentam o reuso de código, reduzindo assim a dor de cabeça na hora de corrigir bugs e melhorando a manutenibilidade do seu projeto como um todo. Um dos pontos cruciais na hora de criar uma PCL é instalar os Nugets de async e de http. A parte de rede é fácil de entender (boa parte das aplicações podem ser resumidas em pegar dados do servidor e exibi-los na tela) e nesse post iremos entender porque o pacote de assincronia é tão importante quanto.

### Async?

`async` é um modificador que foi adicionado no versão 5 do C#. Ele, em par com o operador `await`, existem para facilitar o uso de código assíncrono escrito em C#. O uso dessa feature facilita e muito a programação assincrona. Código que antes precisaria de um callback (uma função que é executada quando a primeiro termina, de forma a permitir que o código prossiga de forma linear) agora pode ser escrito em sequência.

Funções que usam o modificador `async` devem retornar uma [`Task`](https://msdn.microsoft.com/en-us/library/system.threading.tasks.task%28v=vs.110%29.aspx) ou uma [`Task<TResult>`](https://msdn.microsoft.com/en-us/library/dd321424%28v=vs.110%29.aspx). Isso acontece porque uma `Task` é algo a ser resolvido (um conceito chamado future), então toda a parte de assincronia da linguagem foi construída com base no uso dela.

Uma única exceção disso é que métodos `void` podem ser `async`. Isso ocorre em parte porque você pode precisar utilizar `await` dentro de eventos ou métodos de um framework. Existe pequenas diferenças entre `async void` e `async Task`, e elas são melhor explicadas [neste artigo](https://msdn.microsoft.com/en-us/magazine/jj991977.aspx).

### E por que isso é tão importante?

Quando se desenvolve para Xamarin, é muito fácil esquecer que o seu código irá rodar em celulares, mas é muito importante manter isso em mente o tempo todo. Lembre-se que celulares são limitados em termos de memória e bateria, portanto seu app **não pode travar a thread principal, que é a responsável pela UI.** Muitas pessoas esquecem disso e acabam com um app que trava por vários segundos enquanto você acessa a internet ou faz algum processamento pesado, o que é frustrante para o usuário, que acha que seu app deu *crash*.

Quando você usa o operador `await` dentro de uma função `async`, o compilador gera uma máquina de estados que é capaz de pausar a execução do método atual em um determinado ponto, continuar a execução do thread principal e apenas retornar a execução quando a chamada do método terminar. Isso libera o thread principal, permitindo que a tela continue sendo atualizada enquanto você está fazendo a sua operação cara (como acessar a internet ou mudar o tamanho de uma imagem).

### Eu tenho um método que pode ser assíncrono, como faço?

Existe um padrão dentro dos métodos do .net framework que é sempre nomear os métodos que retornam `Task` com o sufixo Async. Sendo assim, se você tem um método que você considera que pode ser assíncrono, basta verificar se ele já tem uma versão async, como é o caso dos método [`Flush`](https://msdn.microsoft.com/en-us/library/system.io.stream.flush%28v=vs.110%29.aspx) e [`FlushAsync`](https://msdn.microsoft.com/en-us/library/hh193384%28v=vs.110%29.aspx). No caso de Streams e Http, você poderá trabalhar com async sem se preocupar em implementar nada. Basta garantir que seus métodos retornam Tasks e usar await direitinho que tudo funcionará. Já quando você precisa fazer seus próprios métodos assíncronos, existem dois jeitos simples de faze-lo Um é usando [`TaskCompletionSource`](https://msdn.microsoft.com/en-us/library/dd449174%28v=vs.110%29.aspx) e o outro é usando [`Task.Run`](https://msdn.microsoft.com/en-us/library/system.threading.tasks.task.run%28v=vs.110%29.aspx). 

Uma regra que pode ser seguida é usar o `TaskCompletionSource` (TCS) quando você precisa transformar um callback em uma `Task`. Eu uso muito esse tipo de pattern quando eu preciso de um DialogBox, por exemplo. Você cria uma `TaskCompletionSource<bool>`, usa o método [`SetResult`](https://msdn.microsoft.com/en-us/library/dd449202%28v=vs.110%29.aspx) como um callback que é chamado quando o  dialog some e em seguida retorna a `Task` atrelada ao TCS. Se o usuário clicar em "Ok", você chama o callback com `true` ou então usa `false` caso contrário. O resultado é um DialogBox que pode ser aguardado.

Já o `Task.Run`serve para você executar um trecha de código (uma `Action`) de forma assíncrona. Esse é um pouco mais difícil de se saber quando usar, portanto lembre-se que [a otimização prematura é a raiz de todo mal](https://pt.wikipedia.org/wiki/Charles_Antony_Richard_Hoare). Por mais tentador que seja, não mude todos os seus métodos para rodar de forma assíncrona indiscriminadamente. Assincronia não deixa o seu código mais rápido, apenas permite que você faça mais coisas por vez.

### Sério que é fácil assim?

Nem tanto. É importante lembrar que chamadas assíncronas **não garantem a continuação da execução do método no Main Thread**. Isso quer dizer que, depois que o processamento pesado acabar, seu método pode ou não voltar a ser executado na thread principal. Isso é um perigo, pois existem certas operações que só podem acontecer na main thread (manipulação de uma `View` que foi inicialmente manipulada no Main Thread é um exemplo). Portanto sempre que for usar métodos assíncronos é importante garantir que a continuação desses métodos pode rodar em uma thread separada.

Finalizando, sempre que você perceber que seu app está travando sempre no mesmo ponto por estar fazendo trabalho demais na thread principal, considere mudar alguma chamada para `async`. Isso pode te ajudar (e muito). A execução dessa série acaba aqui, então você já pode voltar para a thread principal e continuar acompanhando a série "Mvv O que?". Até a próxima!