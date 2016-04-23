---
layout: post
title: "MVV O que? - MVVM aplicado à Xamarin"
category: "xamarin"
tagline: "Episódio II - A estrutura de um app MvvmCross"
series: "mvvm-what"
tags : [mvvm, xamarin, mvvmcross]
---
{% include JB/setup %}

![Cover](/assets/covers/mvvmwhat.png)

### Episódio II - A estrutura de um app MvvmCross

Esse post é a continuação da série sobre MvvmCross em Xamarin. Você pode ler o primeiro episódio, uma introdução ao padrão MVVM e ao MvvmCross, [aqui](/xamarin/2016/02/11/episode-I). Também é recomendada a leitura do artigo [Preparando uma PCL para Xamarin](/xamarin/2016/02/17/episode-I), onde eu explico como funcionam PCLs e alguns problemas comuns que acontecem ao cria-las. O post será mais teórico do que prático e servirá para que vocês entendam melhor como funciona uma aplicação MvvmCross, para não ficar as cegas sobre o funcionamento do framework.

### Por onde começar?

Como visto no post anterior, o MvvmCross irá nos ajudar a separar o código para permitir a maior quantidade de reúso entre plataformas. Isso é alcançado colocando todas as regras de negócio e responsabilidades como navegação, comunicação com API e restauração de estado do app dentro de uma PCL. O padrão de nomenclatura dos apps que usam MvvmCross é sempre o mesmo: Uma PCL chamada `[Nome do seu projeto].Core` e projetos individuais para cada uma das plataformas, sempre usando o padrão `[Nome do seu projeto].[Nome da plataforma]`. Os nomes usados para cada plataformas são:

 - `[Nome do seu projeto].Core` - PCL compartilhada
 - `[Nome do seu projeto].Droid` - Xamarin.Android 
 - `[Nome do seu projeto].IOs` - Xamarin.IOs 
 - `[Nome do seu projeto].Mac` -Xamarin.Mac 
 - `[Nome do seu projeto].Phone` - Windows Phone 
 - `[Nome do seu projeto].Store` - Windows Store 
 - `[Nome do seu projeto].UWP` - Universal Windows Platform
 - `[Nome do seu projeto].WPF` - WPF

Ao instalar o pacote nuget [MvvmCross.StarterPack](https://www.nuget.org/packages/MvvmCross.StarterPack/), alguns arquivos serão criados dentro do seu projeto, com base no tipo de projeto em que o pacote foi instalado. Esses arquivos são o mínimo necessário para você começar o seu projeto. No caso de uma PCL, ele irá criar os arquivos `App.cs` e `FirstViewModel.cs`, respectivamente o ponto de partida da sua aplicação MvvmCross e uma ViewModel básica de exemplo. No caso de projetos de UI, ele tipicamente criará um arquivo `Setup.cs`, contendo informações específicas da plataforma sobre o app MvvmCross,  `DebugTrace.cs`, que permite customizar o output do console, `FirstView.cs`, a View que fará par com a primeira ViewModel e um `LinkerPleaseInclude.cs`. Falarei mais sobre esses em outro artigo, pois hoje nós iremos nos focar no `App` e no `Setup`. 

### O que esses arquivos fazem?

O arquivo `App.cs` cria uma classe que estende [`MvxApplication`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Core/ViewModels/MvxApplication.cs). Essa classe é relativamente simples e é a responsável por auxiliar na customização de algumas partes chave do app. Você **deve** fazer *override* do método `Initialize` e dentro dele chamar o método `RegisterAppStart`. Esse método pode tanto receber um tipo genérico que implemente `IMvxViewModel`, caso onde o Framework sabe que deverá chamar essa ViewModel como a primeira ViewModel do app, assim que tudo for inicializado, quanto uma instancia de uma classe que implemente [`IMvxAppStart`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Core/ViewModels/IMvxAppStart.cs). Aqui, o Framework irá chamar o método `Start` dessa interface e ela irá gerenciar qual ViewModel será exibida. Recomenda-se essa segunda alternativa para quando para quando a lógica de inicialização do seu app for mais complexa.

Já o arquivo `Setup.cs` cria uma classe que herda de [`MvxSetup`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Core/Platform/MvxSetup.cs). A responsabilidade desse tipo é  inicializar o sistema de IoC e chamar a aplicação MvvmCross durante a inicialização do App Nativo. Ele executa uma série de tarefas de inicialização e você pode customizar uma série de componentes fazendo o *override* de alguns métodos. Isso é necessário apenas em alguns casos mais específicos. Obrigatoriamente, você deve sobrescrever apenas o método `CreateApp` (fazendo com que ele retorno a classe `App` que existe no Core da aplicação) e com isso você está pronto.

### Por onde tudo isso é inicializado?

Que bom que você perguntou! O MvvmCross usa estratégias diferentes de inicialização para cada uma das plataformas. No Android, por exemplo, você cria uma `MvxSplashScreenActivity` e a registra como a primeira Activity do seu programa. Quando ela for inicializada, ela criará o objeto de `Setup`, que por sua vez cria o `App` MvvmCross e desse ponto em diante, toda a sua navegação já está sendo gerenciada pelo MvvmCross. 

No iOS, você deve usar uma classe que implemente [IMvxApplicationDelegate](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/iOS/iOS/Platform/IMvxApplicationDelegate.cs) (o jeito mais simples é herdando de  [`MvxApplicationDelegate` ](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/iOS/iOS/Platform/MvxApplicationDelegate.cs)). Fazendo isso, ele irá construir o Setup e inicializar o seu app dentro do método `FinishedLaunching`.  Nas plataformas da Microsoft, algo similar é feito dentro do `App.xaml.cs`: Um `Setup` é construído e inicializado junto com a plataforma nativa.

É importante lembrar que uma vez que o MvvmCross é inicializado, **toda a navegação deve ser gerenciada por ele** (por meio do método `ShowViewModel`). Se você misturar a navegação do MvvmCross com a navegação nativa da plataforma, você eventualmente terá problemas com a gestão do estado do seu app (além de ter que replicar essas navegações em todas as plataformas, já que elas não estarão dentro do código compartilhado). A estrutura de um app MvvmCross é bastante flexível e customizável, portanto se você tiver necessidades específicas de navegação, o ideal é criar um Presenter customizado.

### Navegação? Presenter? Hã?

Calma, calma, já me explico. As ViewModels, como previamente explicado, servem para expor propriedades e abstrair o modelo para que as Views exibam uma determinada informação. Eu vou explicar isso melhor no próximo post, quando eu falarei sobre *DataBinding*. Agora uma outra funcionalidade chave é o método `ShowViewModel`. Chamamos esse método dentro de uma ViewModel quando queremos navegar para outra página¹ do nosso aplicativo. Isso é um jeito simples de controlar a navegação do nosso app e, já que ele fica no Core da aplicação, garante que todas as plataformas exibirão as mesmas informações de forma consistente.

Para atingir esse objetivo, internamente o método `ShowViewModel` faz uso de um objeto que é registrado durante a inicialização do aplicativo. Esse objeto implementa a interface [`IMvxViewPresenter`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Core/Views/IMvxViewPresenter.cs), que é responsável por definir como cada ViewModel deve ser exibida na tela. O framework vem com implementações de *presenters* para as plataformas suportadas (para controlar *Activities* e *Fragments* no Android, *ViewControllers* no iOS e *Pages* no Windows Phone, por exemplo).

Esses *Presenters* padrão cobrem a maior parte dos casos. Para ocasiões onde você precisa de algo mais específico, o MvvmCross permite que você estenda esses *Presenters* para realizar essas operações sem que a navegação saia de dentro do escopo do Framework.

### E agora, o que devo fazer?

Tendo instalado os pacotes necessários e preparado a sua PCL, agora você entende melhor como funciona a estrutura básica de um projeto MvvmCross: Você cria os objetos que inicializam o Framework, usa ViewModels para exibir dados e o método `ShowViewModel` cuida da navegação usando os *Presenters*.

No próximo artigo nós iremos falar sobre a maneira como as informações da ViewModel são exibidas para o usuários: Falaremos sobre *DataBinding*, que é o mecanismo responsável por manter os dados na View atualizados com o da ViewModel. O assunto abrange desde como criar os bindings usando MvvmCross até a explicação da interface que possibilita o padrão MVVM no .net framework, a [`INotifyPropertyChanged`](https://msdn.microsoft.com/en-us/library/system.componentmodel.inotifypropertychanged%28v=vs.110%29.aspx). Portanto fiquem ligados e até a próxima!

¹ - ViewModels não precisam ser apenas páginas, mas essa é geralmente a associação usada por boa parte dos aplicativos. Falaremos sobre isso mais para frente.