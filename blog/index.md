---
layout: page
title: "Ultimos posts"
description: ""
---
{% include JB/setup %}

<ul>
{% for post in site.posts  %}

	
	{% assign preview = post.content | split: '</p>' %}

	<li>
		<a href="{{ BASE_PATH }}{{ post.url }}"> 
			{{ preview[0] }} </p>
			Leia mais...
		</a>
	</li>

{% endfor %}

</ul>