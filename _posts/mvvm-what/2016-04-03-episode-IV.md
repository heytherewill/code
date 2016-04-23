---
layout: post
tagline: "MVV O que? - MVVM aplicado à Xamarin"
category: "xamarin"
title: "Episódio IV - Data Binding em MvvmCross 102"
series: "mvvm-what"
tags : [mvvm, xamarin, mvvmcross]
---
{% include JB/setup %}

![Cover](/assets/covers/mvvmwhat.png)

### Episódio IV - Data Binding em MvvmCross 102

Esse post é a continuação da série sobre MvvmCross em Xamarin. Você pode ler os episódios anteriores [aqui](/xamarin/2016/02/11/episode-I), [aqui](/xamarin/2016/02/24/episode-II) e [aqui](/xamarin/2016/03/14/episode-III). Também é recomendada a leitura do artigo Preparando uma PCL para Xamarin, episódios [I](/xamarin/2016/02/17/episode-I) e [II](), onde eu explico sobre PCLs e o básico sobre assíncronia. O post de hoje é uma continuação direta do último, onde iremos falar sobre outros aspectos do DataBinding. Vamos lá?

### Ainda tem coisa para falar?

Sim, muitas! DataBinding é um assunto extenso e apesar do último post ter tratado de muitos assuntos nós ainda temos muito o que aprender. Algo que não é claro inicialmente é que o DataBinding implica que as propriedades da sua VM e da sua View possuam o mesmo tipo. Isso nem sempre é possível (afinal, a VM estará em uma PCL, que não tem acesso a todos os tipos nativos da sua View), portanto existem momentos em que será necessário utilizar um recurso chamado ValueConverters. Outra coisa que veremos é como fazer o binding entre uma ação, usando os Commands!

### Quando e por que usar ValueConverters?

ValueConverters são um mecanismo que permite que os valores da VM sejam convertidos antes de serem atríbuidos à View e vice-versa. Em um modelo de Binding padrão do .net Framework, implementa-se a interface [`IValueConverter`](https://msdn.microsoft.com/en-us/library/system.windows.data.ivalueconverter(v=vs.110).aspx) e os métodos `Convert` e `ConvertBack` são responsáveis por converter os valores, respectivamente, entre VM e View e View e VM. Como essa interface não é feita para ser portátil, o MvvmCross introduz sua própria interface, a [`IMvxValueConverter`](	), que serve para o mesmo propósito da interface `IValueConverter`, mas que permite que os Converters existam na sua PCL, sendo assim reutilizáveis em todas plataformas suportadas¹!

O funcionamento do Converter é intuitívo. Você recebe um valor e transforma em outro no método Convert. O método ConvertBack serve para fazer o caminho oposto. Note que nesses métodos é passado, além do valor que será usado na conversão, outros três parametros: type, parameter e culture. O primeiro indica o Tipo para qual você está convertendo (afinal essas interfaces recebem e retornam `object`) e o terceiro indica a Cultura do dispositivo (com o intuito de permitir coisas como i18n dentro dos converters). O único que precisa ser explicado é o segundo. Ele é chamado de "ConverterParameter", e ele serve para que a View forneça alguma informação para o converter. Vamos supor que o seu ValueConverter deva agir de um jeito em uma tela e de um outro jeito ligeiramente diferente em outra. Ao invés de criar dois ValueConverters, você indica qual é o ConverterParameter durante o Binding, permitindo assim que o seu ValueConverter execute de acordo com cada situação.

Antes de criar um ValueConverter, é necessário pensar que a ViewModel serve exatamente para modelar os dados das Models de uma maneira que a exibição dos mesmos seja facilitada. Portanto, é importante que você verifique que há realmente uma necessidade em fazer aquilo. Eu gosto de pensar que os ValueConverters são parte da View, então os motivos de criação deles geralmente são referentes à exibição dos dados. Alguns bons motivos para criar um ValueConverter:

__O tipo de valor que você quer bindar não existe na sua PCL__

Esse é o exemplo do [`MvxVisibilityValueConverter`](https://github.com/MvvmCross/MvvmCross-Plugins/blob/master/Visibility/MvvmCross.Plugins.Visibility/MvxBaseVisibilityValueConverter.cs). Cada plataforma tem um jeito específico de definir o que é visivel e o que não é. Portanto esse plugin faz uma ponte entre a sua VM e a sua UI, permitindo a conversão de booleanos, strings e números para os valores nativos que representam Visível e Invisível.

__Algum ponto da exibição dos dados é específica de uma plataforma__

Temos sempre que lembrar que o Xamarin é feito para permitir e facilitar o reuso de código e não para gerar aplicações idênticas. As vezes a View do iOS é diferente da View do Android e isso é perfeitamente normal. Nesse caso, ao invés de colocar a lógica que diferencia ambas na ViewModel, que tem que ser agnostica a plataforma, criamos um ValueConverter. Um exemplo prático disso é se temos um nome muito grande que é exibido na tela. Em um tablet, podemos exibi-lo por completo. Já em celulares, criamos um converter que exibe apenas o primeiro nome e a abreviação do sobrenome.

Existem outros, sem dúvida, mas estes são apenas alguns para ilustrar o meu ponto. É importante não criar ValueConverters indiscriminadamente, pois assim você só aumenta a complexidade do seu app, as vezes sem um bom motivo. É importante também manter em mente que os ValueConverters, assim como muitos outros elementos do MvvmCross, devem ser tão genéricos quanto possível. Se puder criar um converter dentro da sua PCL, crie lá, pois você pode precisar dele em mais de uma plataforma.

### E como eu faço para utiliza-los?

Depois que você decidiu que criar o Converter é necessário, extenda a classe [`MvxValueConverter<TFrom, TTo>`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Platform/Platform/Converters/MvxValueConverter.cs) (que existe apenas para conveniencia; você pode implementar a interface diretamente se quiser). Por questões de padronização, é importante adicionar o sufixo "Converter" ao nome do seu ValueConverter. Feito isso, para utiliza-lo basta usar ele como se fosse uma chamada de método nos Bindings de Android, __omitindo o sufixo converter ao faze-lo__. O primeiro parametro é o valor a ser convertido e o segundo (se você passa-lo) é o ConverterParameter. Note que você pode fazer o encadeamento de vários converters no processo:

	//Neste exemplo, a propriedade Text está bound com a propriedade Name. Antes de exibir a informação, o converter FirstNameConverter é chamado, e o ConverterParameter é o número 0
	local:MvxBind="Text FirstName(Name, 0)"
	//Neste exemplo, o valor passa por dois ValueConverters antes da atribuição
	local:MvxBind="Text Caps(FirstName(Name))"

Se está usando FluentBindings, usar converters é tão fácil quanto. Use o método [`WithConversion`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Binding/BindingContext/MvxFluentBindingDescription.cs#L224) após o método `To()`, passando como parametros uma instância do seu ValueConverter e, se aplicável, o ConverterParameter.

### E se eu quiser fazer algo ao invés de exibir algo?

Que bom que perguntou! Eu já disse [anteriormente](xamarin/2016/02/24/episode-II#por-onde-tudo-isso--inicializado) que toda a navegação do seu app deveria ser controlada pelo MvvmCross. Que legal, temos mais uma coisa que será compartilhada! Mas como isso acontece? Também com DataBinding!

Para esse caso (e para muitos outros) é importante nos aprofundarmos um pouco mais na maneira como o Binding funciona. Até o momento nós usamos apenas binds simples: a propriedade da ViewModel se liga diretamente à propriedades que tem um getter e um setter e às atualizam por meio da interface `INotifyPropertyChanged`. Para muitos casos isso não basta. É o caso do evento de [Click](https://developer.xamarin.com/api/event/Android.Views.View.Click/). Por não ser uma propriedade, e sim um evento, por padrão não tem como fazer um binding nela. Para isso o MvvmCross usa a interface [`IMvxBinding`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Binding/Bindings/IMvxBinding.cs). Ela serve para permitir usos de Binding que vão além do básico que já vimos.

O Binding de Click em específico usa a interface [IMvxTargetBinding](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Binding/Bindings/Target/IMvxTargetBinding.cs) (que provavelmente é a Interface que você vai implementar quando precisar de um Binding customizado, seja diretamente, extendendo a classe abstrata [MvxTargetBinding](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Binding/Bindings/Target/MvxTargetBinding.cs) ou as classes específicas de cada plataforma). Essa interface nos dá meios de criar uma classe capaz de se ligar à View, alterando suas propriedades ou se inscrevendo em seus eventos, enquanto recebe e envia atualizações para a ViewModel. O binding de Click, cujo fonte você pode ver [aqui](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Binding/Droid/Target/MvxViewClickBinding.cs) faz exatamente isso: ele se inscreve no evento de Click da View e chama o Command, que é atualizado de acordo com a ViewModel no método `SetValue`. Wow! Parece trabalhoso, mas é muito mais simples de se fazer do que de se explicar. Veremos como implementar um Binding customizado nessa série, então segure a animação.

### O que é esse tal de Command?

Commands são classes que implementam a interface [`ICommand`](https://msdn.microsoft.com/en-us/library/system.windows.input.icommand(v=vs.110).aspx). Eles são o jeito de criar ações usando o padrão MVVM. Essa interface tem dois métodos, um que contém o código que é executado e um que diz se o comando pode ou não ser executado, e um evento que dispara toda vez que o estado de permissão de execução muda.

Essa interface, contudo, dificilmente precisará ser implementada diretamente. Ao trabalhar com MvvmCross, recomenda-se utilizar a interface [`IMvxCommand`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Core/ViewModels/IMvxCommand.cs) na hora de definir os Commands da sua ViewModel e usar os tipos [`MvxCommand`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Core/ViewModels/MvxCommand.cs) e o [`MvxAsyncCommand`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Core/ViewModels/MvxCommand.cs) (bem como suas variantes genéricas) na hora de efetivamente instanciar os Commands. Esses tipos cobrem a maior parte dos casos, então você dificilmente precisava implementar essa interface na mão.

Uma vez que seu command está devidamente criado e pode ser executado, basta fazer um Binding usando a palavra "Click". Sim, é só isso! No android ficaria assim:

	local:MvxBind="Click MyCommand"

Já no FluentBinding, assim:

	set.Bind(button).For("Click").To(vm => vm.MyCommand);²


### Agora não tem mais o que falar, né?

Ainda tem MUITO o que falar! Esse assunto é extenso demais! Porém não só de binding viverá o homem, então no próximo post eu falarei sobre navegação e presenters, um assunto que será mais importante do que ser um mestre Jedi em DataBinding. Não se preocupe, porém, eu voltarei a falar de DataBinding mais pra frente. Por hora, uma última dica é olhar o método [`FillTargetFactories`](https://github.com/MvvmCross/MvvmCross/blob/4.0/MvvmCross/Binding/Droid/MvxAndroidBindingBuilder.cs#L80) que fica dentro de MvvmCross/MvvmCross/Binding/[Plataforma]/Mvx[Plataforma]BindingBuilder. Irei explicar futuramente o funcionamente exato desse método, mas só de olhar esse método você consegue ter uma ideia. Essas strings que você vê são os bindings padrão do MvvmCross. Isso quer dizer que você pode usa-las no seu projeto! Tem muita coisa legal e que nós nem imaginamos, como o bind de [Rating](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Binding/Droid/Target/MvxRatingBarRatingTargetBinding.cs), por exemplo.

Por hora é isso, aguardo vocês na próxima :)


¹ - Sim, todas mesmo! Para plataformas que usam a interface `IValueConverter`, como o WPF, você pode usar a classe [`MvxNativeValueConverter`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Platform/WindowsCommon/Converters/MvxNativeValueConverter.cs), que cria um wrapper no seu `IMvxValueConverter` e permite a sua utilização diretamente nos Bindings do XAML.

² - Click é o binding "default" das views que são botões em suas plataformas. Desse modo, poderiamos também simplesmente não usar o método `For` e obter o mesmo resultado. Não recomendo fazer isso, contudo, pois requer um conhecimento prévio que nem todos do projeto podem ter (a menos que você faça e coloque um link para esse artigo, hehe).