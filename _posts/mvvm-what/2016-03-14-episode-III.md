---
layout: post
title: "MVV O que? - MVVM aplicado à Xamarin"
category: "xamarin"
tagline: "Episódio III - Data Binding em MvvmCross 101"
tags : [mvvm, xamarin, mvvmcross]
---
{% include JB/setup %}

![Cover](/assets/covers/mvvmwhat.png)

### Episódio III - Data Binding em MvvmCross 101

Esse post é a continuação da série sobre MvvmCross em Xamarin. Você pode ler os episódios anteriores [aqui](/xamarin/2016/02/11/episode-I) e [aqui](/xamarin/2016/02/24/episode-II). Também é recomendada a leitura do artigo Preparando uma PCL para Xamarin, episódios [I](/xamarin/2016/02/17/episode-I) e [II](), onde eu explico sobre PCLs e o básico sobre assíncronia. Esse post tem como intuito ensinar um dos mecanismos mais importantes do padrão MVVM: Data Binding. Iremos ver como esse processo funciona de forma geral (na arquitetura MVVM) e como é a implementação de DataBinding do MvvmCross. Vamos lá?

### Data Binding?

Data Binding é o mecanismo que fornece ao padrão MVVM uma das suas maiores forças, que é a capacidade de unir a ViewModel e a View. De forma simplificada, Data Binding nada mais é do que atrelar propriedades de um objeto fonte (no nosso caso, uma ViewModel) à propriedades de outro objeto (no nosso caso, uma View) com o intuito de mante-las sempre em sincronia. Em outras palavras ao atualizar o valor de uma propriedade na nossa VM, o objeto fonte, esse valor será alterado também na nossa View, permitindo assim que alterações feitas na ViewModel sejam refletidas na interface da nossa aplicação!

Voltando um pouco no que já foi dito, lembre-se que o projeto `Core` é reutilizado em todas as plataformas e nossas ViewModels estão nele. Com o poder do DataBinding, ao alterar o valor de uma propriedade da sua ViewModel, você consegue alterar valores da sua interface. Isso adiciona ainda mais possibilidades de reuso de código, tendo em vista que agora você pode controlar os valores que aparecem para o usuário em todas as plataformas que você pretende suportar em um único ponto.

### E como é que isso funciona?

Lembra quando eu disse no episódio I que o padrão MVVM foi criado pela Microsoft? Pois então, o .net framework possui algumas funcionalidades que facilitam a implementação do DataBinding, como a interface [`INotifyPropertyChanged`](https://msdn.microsoft.com/en-us/library/system.componentmodel.inotifypropertychanged%28v=vs.110%29.aspx) e o sistema de eventos. Uma classe que implementa `INotifyPropertyChanged` (uma ViewModel) deve se preocupar em chamar o evento `PropertyChanged` sempre que o valor de uma propriedade for alterado. Ao fazer isso, todos os objetos que assinaram esse evento (Views) serão notificados dessa alteração e poderão tomar uma ação (no caso, atualizar a interface do usuário).

Um exemplo de como a interface é implementada pode ser visto na classe [`MvxNotifyPropertyChanged`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Core/ViewModels/MvxNotifyPropertyChanged.cs). O método `RaisePropertyChanged` chama o evento `PropertyChanged` indicando qual propriedade foi alterada. Do outro lado, o mecanismo de binding percebe a alteração e atualiza os valores que são exibidos na tela. Tudo isso acontece de forma transparente (lembre-se que a ViewModel nem sabe que a View existe) então você não precisa se preocupar com a View em momento algum. A única coisa que você precisa fazer é se certificar que as propriedades que representam valores exibidos na View sejam implementadas assim:

	private string _name;
	public string Name
	{
	    get
	    {
	        return _name;
	    }
	    set
	    {
	        if (_name != value)
	        {
	            _name = value;
	            RaisePropertyChanged();
	        }
	    }
	}

Nesse exemplo, o método `RaisePropertyChanged()` é chamado sem nenhum parametro pois ele faz uso do [`CallerMemberNameAttribute`](https://msdn.microsoft.com/en-us/library/system.runtime.compilerservices.callermembernameattribute(v=vs.110).aspx), que faz com que o valor do parametro anotado seja o nome do método que o chamou (no exemplo, "Name"). Isso deixa o código mais limpo, evitando que você tenha que explicitamente criar uma string para cada propriedade da VM. Se contudo você precisa notificar a alteração de uma propriedade em outro lugar, você pode fazer isso passando diretamente o nome da propriedade como uma string ou usando uma expressão lambda que passe o nome da propriedade que precisa ser alterada, como no exemplo abaixo:

	//O valor dessa propriedade é dependente do valor da propriedade "IsLoggedIn", por isso ela possui apenas o get
	public string Message
	{
	    get
	    {
	        return IsLoggedIn ? "Seja bem-vindo!" : "Faça login para prosseguir";
	    }
	}
	
	//Essa propriedade indica se o usuário fez login
	private string _isLoggedIn;
	public string IsLoggedIn
	{
	    get
	    {
	        return _isLoggedIn;
	    }
	    set
	    {
	        if (_isLoggedIn != value)
	        {
	            _isLoggedIn = value;
	            RaisePropertyChanged();
	            //Avisa a View que a propriedade Message foi alterada
	            RaisePropertyChanged(() => Message);
	        }
	    }
	}

Se você se sente incomodado com esse boilerplate, você não é o único. Para evitar a digitação desse monte de código, pode usar o [Fody](https://github.com/Fody/Fody), que vai "tecer" as [chamadas ao `RaisePropertyChanged` na IL do seu código](https://github.com/Fody/PropertyChanged) ou pode usar esse [template](/content/mvx.snippet) (tirado [desta resposta](http://stackoverflow.com/a/22110796/3465182)) no Visual Studio para que ele gere esse código base com o atalho `mvxprop` + tab duas vezes. Importar o template no VS é muito simples e é deixado como um exercício para o leitor :)

### Como declarar os bindings usando MvvmCross?

O processo de declaração dos bindings pode ser feito tanto nas linguagens de Markup (.axml no Android e .xaml nas plataformas Windows) quanto no codebehind de cada plataforma. A regra geral é sempre tentar fazer o máximo possível no Markup (afinal assim você deixa suas intenções muito mais claras e legíveis) e só usar o FluentBinding quando você precisar.

Para os que estão acostumados com XAML, o MvvmCross faz uso do mesmo modelo de binding, o que facilita muito para quem já usa MVVM mas nunca usou este framework. Não vou me aprofundar nesse tema pois já existe muito material pronto sobre isso na internet, então vou apenas deixar [esse link](https://blogs.msdn.microsoft.com/jerrynixon/2012/10/12/xaml-binding-basics-101/) que é um excelente material introdutório.

Já no Android, os bindings feitos no markup são simples porém muito expressivos. Primeiro você precisa declarar o namespace `local` no nó pai do seu xml (`xmlns:local="http://schemas.android.com/apk/res-auto"`). Em seguida, você vai usar o atributo `MvxBind` em cada uma das  Views onde você quer realizar o binding. O valor do atributo é uma string que segue o seguinte formato `PropriedadeDaView PropriedadeDaViewModel`, sendo que caso você queira multiplas propriedades deve separar cada uma delas por vírgula. A sintaxe final fica assim:


    <LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
        xmlns:local="http://schemas.android.com/apk/res-auto"
        android:orientation="vertical"
        android:layout_width="match_parent"
        android:layout_height="match_parent">

        <TextView
        	local:MvxBind="Text FirstName"
	        android:layout_width="wrap_content"
	        android:layout_height="wrap_content"/>

        <Button
        	local:MvxBind="Text WelcomeText; Click LoginCommand"
	        android:layout_width="match_parent"
	        android:layout_height="match_parent"/>

    </LinearLayout>

Para quem é acostumado com xml de Android mas não conhece nada de MvvmCross, o trecho acima é bem simples de ser lido. Estou expressando que o texto da primeira TextView será igual ao valor da propriedade `FirstName` da ViewModel¹. Limpo, claro e conciso. Sério, é só isso. Contanto que a view tenha uma propriedade com getter e setter, tudo que você precisa fazer é isso: Escrever o nome daquela propriedade e o nome da propriedade da VM e o motor do MvvmCross vai se virar para criar os bindings e manter aquele valor atualizado. Existem mais possibilidades para esse tipo de binding que iremos ver no próximo post!

### E quando não tem como fazer no xml?

Para o iOS, onde o binding no Markup não está disponível, e para alguns casos onde não tem como você fazer o binding diretamente no xml, devemos usar o chamado FluentBinding para criar as relações entre View e ViewModel. O processo é bem simples. Você primeiro cria um [`MvxFluentBindingDescriptionSet`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Binding/BindingContext/MvxFluentBindingDescriptionSet.cs) usando o método de extensão [`CreateBindingSet`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Binding/BindingContext/MvxBindingContextOwnerExtensions.Fluent.cs#L12-L17). Uma vez criado, você deve usar os métodos da interface da seguinte forma:

    var set = this.CreateBindingSet<MyView, MyViewModel>();
    set
    .Bind(editText) //View que será usada no binding
    .For(v => v.Text) // expressão lambda (ou string) que indica qual propriedade da View será usada no binding
    .To(vm => vm.FirstName); //expressão lambda (ou string) que indica qual propriedade da ViewModel será usada no binding

    //Similar ao acima, mas em uma linha :)
    set.Bind(button).For(v => v.Text).To(vm => vm.WelcomeText);

    //Se esquecer de chamar o Apply, nada acontecerá!
    set.Apply()

Como você pode ver, existem alguns problemas no FluentBinding que não existem no binding de texto. Um deles é a sintaxe, que é fácil de esquecer/confundir. Outro é a quantidade de código que você precisa. Não é muito, mas se você pode descrever a mesma coisa usando menos no xml, não tem motivo para não faze-lo. Tirando esses pequenos problemas (que só existem se você estiver comparando com a alternativa que é usar o binding de texto), usar a sintaxe fluente não é nada de outro planeta, portanto não se sinta intimidado!

### Esse post foi grande, hein?

Sim, bem maior que o de costume. E eu ainda nem esgotei o assunto! Portanto leia tudo, dê um tempo para que seu cérebro absorva o conteúdo e depois leia novamente para fixação! Nos próximos posts vamos continuar falando de DataBinding, mas desta vez iremos tratar de bindings customizados (para necessidade mais específicas), Commands (usados para bindar ações ao invés de valores) e ValueConverters (que transformam o valor antes de exibi-lo). Portanto fique ligado porque vem muita coisa legal pela frente :)

¹ - O MvvmCross localiza as ViewModels com base no nome da View, portanto se você criar a `FirstView`, ele vai saber que o contexto dos bindings daquela View deve ser uma instância da classe `FirstViewModel`. Esse comportamento pode ser alterado implementando o tipo [`IMvxNameMapping`](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Core/ViewModels/IMvxNameMapping.cs) e alterando o retorno padrão do método [CreateViewToViewModelNaming](https://github.com/MvvmCross/MvvmCross/blob/f7fcf18d960f578b851837f2aaaeb4d0e3b72364/MvvmCross/Core/Core/Platform/MvxSetup.cs#L283).