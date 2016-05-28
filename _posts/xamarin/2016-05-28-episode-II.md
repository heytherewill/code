---
layout: post
tagline: "Xamarin 101"
category: "xamarin"
title: "Episódio II - PCL vs Shared Project"
series: "xamarin101"
tags : [xamarin.android, xamarin, android]
---
{% include JB/setup %}
![Cover](/assets/covers/xamarin101.png)

### Episódio II - PCL vs Shared Project

Este post é parte da série Xamarin 101, que é voltada para pessoas que estão começando no Xamarin. A lista com todos os posts da série pode ser encontrada [aqui](/xamarin/2016/04/28/index). No post de hoje iremos falar sobre uma dúvida que aparece logo na hora de criar o projeto, antes mesmo de você começar a programar: Devo compartilhar código usando PCL ou Shared Project?

### Compartilhamento de código?

Como vocês já devem saber, uma das grandes vantagens do Xamarin é a capacidade de compartilhamento de código entre plataformas. Já que todo seu código roda no mesmo runtime você consegue usar partes desse código em mais de um lugar. Isso é uma perspectiva muito interessante; Imagine que a mesma linha de código é executada tanto em um XBox quanto em um iPad, passando por dispositivos Android, wearables e Desktops. É sensacional! 

Como nem tudo são flores, não tem como compartilhar **todo** código. Dispositivos diferentes tem necessidades diferetes (e expõem APIs diferentes). Isso quer dizer que nem tudo que um iPhone faz o seu relógio faz! Sendo assim, a estatégia geral é ter uma área de código comum que pode ser compartilhada entre as plataformas. 

Existem duas maneiras de abordar esse problema: PCLs e Shared Projects. Eu já falei sobre PCLs antes aqui no blog [nesse artigo](/xamarin/2016/02/17/episode-I)), então vocês podem le-lo  para se familiarizar com os conceitos, caso não saibam. Vou começar falando sobre os Shared Projects.

### Shared Projects?

Um Shared Project é diferente de uma PCL pois ele não é compilado diretamente. Ao invés disso, todos os arquivos que estão no seu Shared Project são incluídos no projeto específico de cada plataforma e compilados ao mesmo tempo. Isso faz com que você possa escrever qualquer coisa nos arquivos que estão no Shared Project, pois o compilador irá verificar se aquele código é válido uma vez para cada compilação específica de plataforma.

Claro que isso não faz apis aparecerem magicamente. Se você usar, por exemplo, o tipo `UIImage` no Shared Project, ele vai compilar perfeitamente no iOS e falhar no Android, já que `UIImage` não existe nas apis do Android. É exatamente nesse momento que o Shared Project pode começar a ficar bagunçado, pois é quando você começa a precisar das chamadas **diretivas de pré-processamento**.

### Diretiva do que?

Apesar do nome elegante, você provavelmente já esbarrou com alguma dessas antes. Diretivas de pré-processamento são instruções iniciadas com `#` que alteram o código que será compilado, na fase de análise léxica. As diretivas que são amplamente utilizadas nos Shared projects são o `#if` e o `#endif`

A diretiva `#if` verifica se um símbolo foi definido. Se ele foi definido, as linhas de código até a linha que contém o `#endif` serão compiladas. Caso o símbolo não exista, elas serão ignoradas. Um exemplo clássico disso é quando você precisa de um comportamento diverso para builds de desenvolvimento e de produção. O símbolo `DEBUG` é definido apenas em builds de debug, então você consegue fazer algo assim:

#if DEBUG
System.Console.Write($"WARNING: {message}")
#endif

No exemplo acima, a linha que mostra a mensagem no console só será inclusa em builds de debug. Para as builds de release essa linha será ignorada. Símbolos novos podem ser definidos nas configurações do projeto ou usando a diretiva [`#define`](https://msdn.microsoft.com/pt-br/library/yt3yck0x.aspx). 

O mesmo pode ser feito para incluir código condicional no Shared Project. O símbolo `__ANDROID__` já vem definido nos templates de projetos Android (e o mesmo para o símbolo `__IOS__`). Isso quer dizer que código já pode ser incluído de forma condicional. Veja o exemplo abaixo:

var byteArray = await GetImageFromFromUrlAsync("https://placekitten.com/400/400");

#if __ANDROID__
//TODO: Carregar a imagem para Android
#endif

#if __IOS__
//TODO: Carregar a imagem para iOS
#endif

O código dentro do primeiro bloco só será compilado em projetos Android. Isso significa que dentro desse bloco você pode colocar código específico de Android, pois ele será ignorado em outras plataformas.

### E qual o problema dessa abordagem?

Essa técnica tem dois problemas e ambos vão aumentando junto com o tamanho do seu projeto. O primeiro é o fato de que esse monte de diretivas torna o seu código uma bagunça. Conforme a complexidade do seu código vai aumentando, esse monte de linhas adicionais vão se somando e tornando a manutenção do seu código cada vez mais complicado.

O segundo problema é o fato de apenas algumas linhas do seu código serem analisadas por vez. Isso significa que você pode fazer alterações que literalmente quebram em alguma plataforma e você só vai fazer isso quando tentar compilar a outra plataforma, o que é um problema enorme.

Esses dois problemas (e o fato de que ambos fazem projetos escalar muito mal) faz com que muitas pessoas usem PCL e abominem Shared Projects por completo.

### Então o Shared Project é um erro?

Não necessariamente. Eu, por exemplo, sou um advogado da PCL. Prefiro utiliza-la em todos os meus projetos. Existem contudo inúmeros desenvolvedores que preferem usar Shared Project (um deles é ninguém menos que o próprio [Miguel de Icaza](http://tirania.org/blog/archive/2016/Jan-22.html)).

O que esses desenvolvedores defendem não é esse monte de `#if` amontoado. O que acontece é que existe um outro jeito de usar os Shared Projects. Esse jeito é por meio de [partial classes](https://msdn.microsoft.com/pt-br/library/wa80x488.aspx).

Esse método é simples, limpo e livre de problemas. Você apenas precisa criar um método parcial que isola a funcionalidade específica de cada plataforma. Feito isso, todo o código que fica no Shared Project roda de forma cross em todas as suas plataformas. O código específico é implementado em outro arquivo, no projeto específico.

Essa abordagem resolve ambos os problemas das diretivas. Você não tem um monte de `#if` sem necessidade, não tem código "morto" flutuando e tem uma separação clara das fronteiras entre código compartilhado e específico de plataforma. 

### Qual a conclusão disso tudo?

Como quase sempre, nenhuma. O objetivo desse post é ensinar as diferenças desses dois tipos de projeto. A PCL limita o framework com o intuito de garantir que o seu código funciona em todas as plataformas que você pretende desenvolver. O resto do código pode ser inserido com injeção de dependência. O Shared Project não proíbe nada e você pode usar diretivas de pré-processamento ou partial classes para garantir que seu código funciona em todas as plataformas.

Tendo esse conhecimento em mãos, cabe a você escolher o que melhor resolve seu problema. A via de regra é que se você vai compartilhar seu código (com uma biblioteca, por exemplo) o melhor é usar PCL. Para código seu (em caso de apps) você pode escolher entre as duas opções. Eu sempre escolho PCL, mas você tem liberdade de escolha. 

Espero que vocês tenham gostado do conteúdo e, se algum dia tiverem que dar manutenção em algum app que usar Shared Project, lembre-se de usar partial classes :)