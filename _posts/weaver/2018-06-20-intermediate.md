---
layout: post
tagline: "Getting a better understanding of weavers"
category: "weaver"
title: "The pocket guide to metaprogramming in .NET"
series: "weaver"
tags : [weaver, fody, .net, c#]
---
{% include JB/setup %}

![Cover](/assets/covers/weaver2cover.jpg)

### Introduction 🎉

In this article, we'll focus on tools that will help us manipulate MSIL/CIL and write a program that does it for us. Note that the specifics of Fody plugin development are a different beast that will require an article of its own.

As usual, knowledge of C# is mandatory, but for this article you'll also need to have familiarity with what weavers are; hence why reading my previous article is mandatory. No, you don't need to know any MSIL/CIL, how to decompile `.dll`s or anything; We'll learn it as we go!

The idea is that by the end of this article you should be able to:

- Decompile `.dll`s into MSIL code
- Understand, even if roughly, the IL instructions you disassembled
- Modify existing assemblies to inject the desired behaviour



### Setting up our tools 🛠

For this article you’re gonna need:

- A decompiler (since the tutorial assumes a macOS environment, we’ll use ILSpy, more specifically this fork here)
- Some diff software for comparing instructions
- Mono.Cecil, for emitting the instructions needed

Since the decompiler we’re using here has a CLI and does not serve any pre-compiled binaries, clone the repository linked above and build it using Visual Studio For Mac/Rider. Once you've built it, move the compiled binaries to any folder you want and add a convenience function to your `~/.bash_profile` (or `~/.zshrc`), like this:

```bash
function decompile() { 
  mono /path/to/ILSpyMac.exe -t il $1 
}
``` 

Once you've done that, you can simply call `decompile /path/to/dlls` whenever you want to peek into freshly decompiled MSIL. Yay!

### On with the decompilation 🏗

The weaver we're gonna create is really simple: it'll modify a method to add a `Console.Log("This I wove!")` at the very end of it. When trying to achieve such tasks, the first thing we need to do to write two versions of the same class: One with the code we want to write and other with the code we want to have after the weaver. For our example, it'd be something like this:
Note that the second function is called ProperMain just so the program compiles

```csharp
public class WhatIWantToWrite
{
    public static void Main(string[] args)
    {
        System.Console.WriteLine("This I wrote");
    }
}

public class WhatIWantToGet
{
    public static void ProperMain(string[] args)
    {
        System.Console.WriteLine("This I wrote");
        System.Console.WriteLine("This I wove");
    }
}
```

Now, add a lightweight .csproj next to it so that generating the `.dll`s is as simple as calling `dotnet publish -c Release minimal.csproj`. Remember to compile your libraries in Release mode!

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>netcoreapp2.0</TargetFramework>
  </PropertyGroup>
</Project>
```

To take a look at the generated il, you simply call `decompile bin/Release/netcoreapp2.0/publish/` from your closest terminal. If you then step in that publish folder, you'll see that there's a `.il` file sitting there!

### What's inside that .net program? 📦

The .il file we just generated can be opened by any text editor. You'll notice that it kind of looks like C#, but not quite. While the intermediate language might, at first sight, look a bit daunting, you'll quickly realize that you can still see the names of the classes and methods you defined in your `.cs` files.

The snippet below contains the MSIL/CIL representation of the two methods I showed above. Note that I removed all the headers and information that's not relevant to what we want to achieve. I encourage you to take a look at your own file as well and try to figure out where your methods are.

```csharp
.class public auto ansi beforefieldinit WhatIWantToWrite
	extends [System.Runtime]System.Object
{
	// Methods
	.method public hidebysig static 
		void Main (
			string[] args
		) cil managed 
	{
		// Method begins at RVA 0x2050
		// Code size 11 (0xb)
		.maxstack 8
		.entrypoint

		IL_0000: ldstr "This I wrote"
		IL_0005: call void [System.Console]System.Console::WriteLine(string)
		IL_000a: ret
	} // end of method WhatIWantToWrite::Main

	.method public hidebysig specialname rtspecialname 
		instance void .ctor () cil managed 
	{
		// Method begins at RVA 0x205c
		// Code size 7 (0x7)
		.maxstack 8

		IL_0000: ldarg.0
		IL_0001: call instance void [System.Runtime]System.Object::.ctor()
		IL_0006: ret
	} // end of method WhatIWantToWrite::.ctor

} // end of class WhatIWantToWrite

.class public auto ansi beforefieldinit WhatIWantToGet
	extends [System.Runtime]System.Object
{
	// Methods
	.method public hidebysig static 
		void ProperMain (
			string[] args
		) cil managed 
	{
		// Method begins at RVA 0x2064
		// Code size 21 (0x15)
		.maxstack 8

		IL_0000: ldstr "This I wrote"
		IL_0005: call void [System.Console]System.Console::WriteLine(string)
		IL_000a: ldstr "This I wove"
		IL_000f: call void [System.Console]System.Console::WriteLine(string)
		IL_0014: ret
	} // end of method WhatIWantToGet::ProperMain

	.method public hidebysig specialname rtspecialname 
		instance void .ctor () cil managed 
	{
		// Method begins at RVA 0x207a
		// Code size 7 (0x7)
		.maxstack 8

		IL_0000: ldarg.0
		IL_0001: call instance void [System.Runtime]System.Object::.ctor()
		IL_0006: ret
	} // end of method WhatIWantToGet::.ctor

} // end of class WhatIWantToGet
```

See the similarities? There's a .class that has the same name of our classes and a .method with the same name as our method. Not that hard to follow, right?

### Where my diffs at? 🔎

The next step is to spot differences between these two classes. For that, use a diff tool. You can check the diff for those two classes clicking [here](https://www.diffchecker.com/tNmNIi8e).

The main highlighted differences are:

- .entrypoint in the file to the left
- One ldstr instruction in the file to the right
- One call instruction in the file to the right

.entrypoint is not relevant to us. it gets added automatically to methods like static void Main(string[] args) , to indicate that they are the first method to be called in a program. We had to name our methods differently to avoid compilation errors, which means we don't have to weave this instruction. As for the other two instructions, ldstr pushes a string literal onto the stack andcall invokes a method (in this case, the System.Console.Log method) using the previously pushed string as a parameter. Piece of 🍰.

### Rewriting our `.dll` 🔮

Now we are going to write a program that reads our `.dll` file, adds the missing instructions to it and saves it all into a new file. For that we're gonna use one of my favorite .net tools ever: [Cecil](https://github.com/jbevain/cecil).

Simply put, Cecil makes IL editing easier to swallow. I would go so far as to say it even makes the process pleasant, but I'm biased because I love this subject.

The API Cecil exposes is easy for programmers to understand. If you have a `TypeDefinition` , it'll have a `Methods` property which has a list of the type's methods, just like you'd expect any .net library to have. For that reason, I won't be getting into the details of how to use Cecil. Take your time, explore it a bit and witness its simplicity with your very eyes.

Anyways, the program to modify our `.dll` can be seen below:

```csharp
public class EntryPoint
{
    public static void Main(string[] args)
    {
        // 1
        var assemblyLocation = Assembly.GetExecutingAssembly().Location;
        var pathToOriginalDll =
            Path.GetFullPath(Path.Combine(assemblyLocation, "../path/to/your.dll"));

        // 2
        var pathToNewDll = pathToOriginalDll.Replace(".dll", "AfterWeaver.dll");
        File.Copy(pathToOriginalDll, pathToNewDll, true);

        // 3
        var moduleDefinition = ModuleDefinition.ReadModule(pathToNewDll);

        // 4
        var mainMethod = moduleDefinition
            .GetTypes()
            .Single(t => t.Name.Contains("WhatIWantToWrite"))
            .Methods
            .Single(m => m.Name.Contains("Main"));

        // 5
        var processor = mainMethod.Body.GetILProcessor();
        var consoleWriteLineInstruction = processor.Body.Instructions.Skip(1).First();

        // 6
        processor.Append(processor.Create(OpCodes.Ldstr, "This I Wove!"));
        processor.Append(consoleWriteLineInstruction);

        // 7
        var stream = new FileStream(pathToNewDll, FileMode.OpenOrCreate);
        moduleDefinition.Write(stream);
    }
}
```

Comment by comment, it:

- 1: Fetches the original `.dll` file
- 2: Creates a copy of it with a different name
- 3: Reads the new `.dll` into a ModuleDefinition
- 4: A simple LINQ query to find the method we want to replace
- 5: Gets the IL processor and finds the instruction we want to copy
- 6: Adds the instructions that were missing
- 7: Writes the modified assembly back into the created file

There's nothing else to add. That's all. If you then decompile the new `.dll` , you'll see that the two instructions (`ldstr` and `call`) are there.

Victory is ours! 🎉

### Wrapping it all up 🤓

As you can see, this subject is not rocket science. We used a little bit of LINQ, a nice API that’s easy for any programmer to understand, then did some basic file IO. Nothing to be afraid of. Even if your idea of weaver is bigger, those things don't get more complicated than that. This means that, even though the idea of IL manipulation sounds insane at first, it doesn't add as much complexity as one would initially imagine. Again, YMMV 🤷‍♂

If you have learned all of the above correctly, you just need to learn some Fody before you can publish your own Weavers. This will come in the next article. Until then, feel free to ping me on Twitter if you have any doubts

Good luck and happy weaving!