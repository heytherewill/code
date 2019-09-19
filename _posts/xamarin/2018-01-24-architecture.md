---
layout: post
tagline: "A simple guide to Xamarin architecture"
category: "xamarin"
title: "My approach to Xamarin architecture explained with Asimov References"
tags : [xamarin, .net, c#, architecture]
---
{% include JB/setup %}

![Cover](/assets/covers/xamarin1cover.png)

_DISCLAIMER: All quotations from the Encyclopedia Galactica here reproduced are taken from the 116th Edition published in 1020 F.E. by the Encyclopedia Galactica Publishing Co., Terminus, with permission of the publishers._

When I joined [Toggl](toggl.com) last year, I was hired as a mobile developer and I basically had to hit the ground running and develop an app from scratch. This app was [Superday](https://superday.toggl.com/), and it was written in Swift, a language that I barely knew. After working on Superday for a few months, I was given the task to rewrite the Toggl mobile apps. From scratch. Hooray 🎉.

### New app who dis? 📱

At Toggl we are not constrained to any technology. I am a Xamarin Specialist, as you may know, but by no means do I think that Xamarin is the ultimate platform and that all apps should be written in C#. Every app has different needs. Superday was meant to be written in Swift; due to its heavy usage of platform APIs, code share would be minimum. Using Xamarin there would simply slow us down, so no reason for doing that.

Swift being a language though for mobile makes working with it very pleasant. It has a lot of useful features that will only appear in C#8+ (Optional reference types, for example). I simply loved working with it. However, when deciding to rewrite the apps, we still chose Xamarin.

That's because of Toggl's business model; We have the opportunity to share a lot of code. When I say *a lot*, I mean it. It's *a lot*. We share API, database access, business logic, UI logic (yay, MVVM). This shared code includes the syncing algorithm, something that every app needs to do (and that was a pain in the butt in the previous app). We chose not to share UI (Xamarin.Forms) because of the heavy customisation of components, but we still didn't want to waste the potential of code sharing we had in our hands.

With that in mind the architecture was designed. The app has 5 main projects which are platform agnostic:

- Common utilities and extensions that are used in the entire app
- Network communication
- Persistence
- Business Logic
- The shareable portions of UI (i.e.: ViewModels)

We could name each layer with a boring name like "DAL" or "BLL", but that's for people who go to offices and wear ties. We are too cool for that [citation needed], so we decided to name each layer with an Isaac Asimov reference. Here are the results:

### Multivac 💻

There is as yet insufficient data for a meaningful answer as to why we decided to name this portion of the app [Multivac](https://en.wikipedia.org/wiki/Multivac).

This layer contains super common extensions, methods for guarding against null/invalid state, extensions on top of Rx.Net, some structures to prevent [Primitive Obsession](https://blog.ploeh.dk/2011/05/25/DesignSmellPrimitiveObsession/), and all sorts of niceties.

This layer also has common interfaces that represent Toggl's data types. Each layer is then responsible for providing a concrete implementation of this interface in order to deal with data. This is done this way because each layer has different needs, but they all can communicate using those common interfaces).

### Ultrawave 📡

Even though we (still) don't make communications at the speed of light, our API layer is named after [ultrawaves](https://en.wikipedia.org/wiki/Ultrawave).

This layer is responsible for:

- Serialization of JSON into .net types
- Handling network calls
- Catching all API related errors and transform them into custom Exceptions

While it main seem odd at first to share networking code (given how each device implements their own HTTP stack), Xamarin’s Native `HttpClientHandler`s make allow us to benefit from platform specific networking while using all niceties from .net's HTTP apis.

Each project's concrete implementation of the model interfaces has a peculiarity. The Ultrawave models are aware of (de)serialization rules, which ensure that the model's string representation is always valid regardless of which endpoint is being called.

This layer, like all others, is LinkerSafe, for we want to squeeze every last byte from the final binary. Also like all layers, Ultrawave is thoroughly tested (Integration tests included).

Ultrawave exposes clients (similar to what Octokit.net does) that allow you to make requests. The client's methods expose Observables, so API calls should be as transparent as possible: All required data gets in, Ultrawave transforms it into an HttpRequest with appropriate Headers/Body/etc, handles all the networking and returns the result (or an error).

The main idea behind creating an API client was to abstract networking completely. The UI portion of the app has no idea about HTTP Status codes and the like. Consumers of a data provider don't care about what the provider does to fetch data. They simply want the data. This core concept holds for all layers of our application that provide data.

### PrimeRadiant 🔮

The team responsible for maintaining the Toggl apps is, internally, called _Psychohistorians_. Our Prime Radiant, however, doesn't store equations. It stores user data.

This layers is responsible for storing and retrieving data locally. Simple as data. Since our apps follow offline-first principles, PrimeRadiant has to be blazing fast and reliable, since in most situations users will fetch data only from offline sources.

For storing the entities that model our business logic, we are using [Realm](https://realm.io/). It's free, simple to use, [open source](https://github.com/realm/realm-dotnet/), thought for mobile, supports Xamarin as a first class citizen and, of course, fast. This set of features made us ditch SQLite and favour Realm, a decision we are very happy to have made.

For user settings and usage flags that can be expressed as key-value pairs, we resort to whatever native means we have (e.g. `SharedPreferences` in Android and `NSUserDefaults` in iOS).

### Foundation 🚀

Foundation was established to — after an initial period of struggle and barbarism usher in a new era of stability and prosperity for Toggl native apps. Yes, it was, by far, the easiest name to pick 😛

This is the shared layer where we combine the existing layers (which are, within reason, merely building blocks) in a way that makes sense for Toggl as a business. It's the layer that contains the syncing algorithm, code to modify local data in a sensible way, parsers for the shortcuts of when you start a new time entry, among others.

Code in this layer can be tested easily and can be shared across every platform we support, so we want Foundation to have as much code as possible. Code that gets written here doesn't need to be duplicated in platform specific projects, which was our goal when choosing Xamarin as our platform.

One thing about Foundation is that we chose to use a UI framework to leverage our productivity/code share even further. We chose MvvmCross due to its maturity, platform support and because we know it well.

Since we don't want Foundation to have a dependency on a UI framework, something that can be swapped in the future or that we may choose not to use in some different platform, we have the Foundation Layer split in two .csprojs and only include things in Foundation.MvvmCross if they have a dependency on the framework.

The same thing happens with PrimeRadiant and Realm (and pretty much every other library we use). It can all be changed for whatever reason (performance, deprecation and experimentation, to name a few). The only dependency that we can't really get rid of is Rx.Net, but then again, why would we? 💪

### And then what? 🤔

Each platform specific project is named after a robot (Daneel and Giskard are, respectively, the iOS and Android projects). These projects should be as slim as possible and only contain things like custom views and boilerplate. At the point of writing this, the amount of shared code in the iOS project is of about 68%. This number only tends to go higher, even though it can't ever be 100%.

This, as usual, is not a silver bullet and might not be suited for everyone. I hope, however, that it offers you insights on how to think in a more Cross Platform way when separating the concerns of your applications.