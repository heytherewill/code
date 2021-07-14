---
layout: page
title: "will writes code"
description: ""
---
{% include JB/setup %}

<ul class="index-page">
{% for post in site.posts  %}

	{% assign parts = post.content | split: '</h3>' %}

	{% assign preview = parts[1] | strip_html | truncatewords: 60 %}

	<li>
		<a href="{{ BASE_PATH }}{{ post.url }}"> 
		
			<h3> {{ post.title }} </h3>
			<h4> {{ post.tagline }} </h4>
			{{ preview }}
		</a>
	</li>

{% endfor %}

</ul>