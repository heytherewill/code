---
layout: post
tagline: "MVV O que? - MVVM aplicado à Xamarin"
category: "xamarin"
title: "Episódio VI - Inversão de controle em MvvmCross"
series: "mvvm-what"	
tags : [mvvm, xamarin, mvvmcross]
---
{% include JB/setup %}

![Cover](/assets/covers/mvvmwhat.png)

### Episódio VI - Inversão de controle em MvvmCross

Esse post é a continuação da série sobre MvvmCross em Xamarin. Você pode ler os episódios anteriores [aqui](/xamarin/2016/02/10/index). Nesse post eu irei demonstrar a importância da inversão de controle e como implementar os dois padrões mais comuns, *Dependency Injection* e *Service Locator*.

### O que é inversão de controle?

Inversão de controle é um *pattern* que reduz a quantidade de responsabilidade que uma classe deve ter. Um classe deve realizar apenas a tarefa que lhe é designada. Os serviços necessários para que essa tarefa seja cumprida devem ser então provisionados por um framework terceiro, permitindo assim que a classe se preocupe apenas em fazer uma coisa. Esses conceitos, ainda que simples, auxiliam na criação de classes mais fáceis de manter, simples de testar e que comunicam de forma clara suas relações dentro da arquitetura geral do Software.

Um exemplo simples de como IoC pode facilitar é a seguinte classe:

```
public class Cat
{
    private readonly IToy _toy;

    public Cat()
    {
        _toy = new RubberMouse();
    }
}
```

A classe `Cat` é responsável por construir o seu próprio brinquedo. Se por acaso quisermos substituir esse brinquedo, precisamos alterar a classe para alterar o objeto que está sendo criado. Isso é um problema caso queiramos testar a classe `Cat`, uma vez que um bug na classe `RubberMouse` pode causar falsos positivos. Queremos desacoplar nosso código para evitar situações como esse. Sendo assim, se usarmos IoC, precisamos fornecer o brinquedo para o gato de alguma forma. Nesse caso, podemos usar o construtor:


```
public class Cat
{
    private readonly IToy _toy;

    public Cat(IToy toy)
    {
        _toy = toy;
    }
}
```

Pronto! Agora que a classe recebe sua dependência, podemos passar um *Mock* da interface `IToy` quando estivermos testando, já que a responsabilidade de construção do objeto não é mais da classe.

### E como fazer isso no MvvmCross?

Como eu já venho mencionando, o MvvmCross tem funcionalidades que vão bem além do tradicional MVVM. Ele nos oferece algumas estratégias para lidar com IoC. Essas são injeção de dependencias (por meio de construtores ou de propriedades) e o uso do padrão *ServiceLocator*. Para o nosso exemplo eu irei usar uma ViewModel e mostrar como poderiamos injetar uma dependência nela. O exemplo é a class `LoginViewModel` e ela tem o mesmo problema que a classe do exemplo anterior: A relação dela com suas dependencias não é flexivel, tornando-a difícil de testar.

```
public class LoginViewModel : MvxViewModel
{
    private readonly IApiService _service;

    public LoginViewModel()
    {
        _service = new ApiService();
    }
} 
```

Vamos começar resolvendo o problema com injeção de dependência (DI, do inglês *Dependency Injection*), um termo complicado de se falar e simples de se entender. DI é exatamente o que eu fiz no exemplo da classe `Cat`: Você remove responsabilidades da classe, fazendo com que essas sejam **injetadas** na mesma, tornando-a mais flexivel e testavel. O MvvmCross fornece duas maneiras de fazer isso nas VMs. Como a construção das ViewModels é gerenciada pelo mecanismo de navegação do MvvmCross, basta você adicionar parametros no construtor que o framework irá se preocupar em injetar os serviços na sua classe conforme necessário! Mais fácil impossível, né?

```
public class LoginViewModel : MvxViewModel
{
    private readonly IApiService _service;

    public LoginViewModel(IApiService service)
    {
        _service = service;
    }
} 
```

Parece até brincadeira, mas só de fazer isso o MvvmCross já sabe que precisa injetar o serviço ao construir sua classe. A injeção de propriedades é tão simples quanto, ainda que não muito bem documentada. Basta anotar seus métodos com o atributo [`MvxInjectAttribute`](https://github.com/MvvmCross/MvvmCross/blob/8a824c797747f74716fc64c2fd0e8765c29b16ab/MvvmCross/Platform/Platform/IoC/MvxInjectAttribute.cs) em uma propriedade publica que a ViewModel funcionará normalmente!

```
public class LoginViewModel : MvxViewModel
{
    [MvxInject]
    public IApiService Service { get; set; }
} 
```

Igualmente simples! Um único possível problema dessa abordagem é que a propriedade precisa ser pública, mas isso é extremamente útil em casos onde você precisa herdar de uma classe em comum sem precisar colocar o parametro em todos os construtores. Um outro ponto sobre DI com MvvmCross é que, caso você precise construir a ViewModel já com suas dependencias (no caso de testes, por exemplo), você pode chamar o método `IoCConstruct` da classe estática [`Mvx`](https://github.com/MvvmCross/MvvmCross/blob/develop/MvvmCross/Platform/Platform/Mvx.cs) que ele irá fazer tudo isso que o MvvmCross faz: Instanciar o objeto e injetar os serviços no construtor e nas propriedades.

Já o *ServiceLocator* funciona de forma um pouco diferente. Ao invés de injetar as dependencias, você tem uma classe que é responsável por devolver objetos conforme necessário. No MvvmCross, você usa a classe `Mvx`(que por debaixo dos panos usa uma implementação de [`IMvxIoCProvider`](https://github.com/MvvmCross/MvvmCross/blob/develop/MvvmCross/Platform/Platform/IoC/IMvxIoCProvider.cs)), mais específicamente o método [`Resolve`](https://github.com/MvvmCross/MvvmCross/blob/develop/MvvmCross/Platform/Platform/Mvx.cs#L31-L35). Esse método aceita como parametro genérico um tipo e retorna um objeto do mesmo tipo. O que ele faz é procurar os serviços registrados até encontrar o que é necessário, lançando uma [`MvxIoCResolveException`](https://github.com/MvvmCross/MvvmCross/blob/develop/MvvmCross/Platform/Platform/Exceptions/MvxIoCResolveException.cs) caso não encontre nada. Aqui um exemplo de como a classe `LoginViewModel`

```
public class LoginViewModel : MvxViewModel
{
    private readonly IApiService _service;

    public LoginViewModel()
    {
        _service = Mvx.Resolve<IApiService>;
    }
} 
```

Como você pode ver, o problema dessa abordagem é que não tem como saber quais são as dependencias da classe em tempo de compilação. Sendo assim, o que eu recomendo é evitar essa prática exceto onde ela seja necessário. Outra dica que eu dou é que você evite os outros métodos da classe `Mvx` (como o `TryResolve` e o `CanResolve`) que não lançam Exceptions, pois idealmente você quer que tudo falhe o quão rápido quanto possível para pegar os erros de forma rápida. Claro que isso não é um dogma; existirão momentos onde você pode ou não precisar da `Exception` ou do padrão *ServiceLocator* como um todo, mas isso deve ser analisado caso a caso e por via de regra a injeção de dependencia deve ser o jeito preferido de fazer IoC.

### Mas perai, como ele sabe como criar os objetos que serão injetados?


