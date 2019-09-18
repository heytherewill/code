---
layout: page
title: "Latest posts"
description: ""
---
{% include JB/setup %}

<ul class="index-page">
{% for post in site.posts  %}

    {% if post.series != "index" %}
	{% assign parts = post.content | split: '</h3>' %}

	{% assign preview = parts[1] | strip_html | truncatewords: 60 %}

	<li>
		<a href="{{ BASE_PATH }}{{ post.url }}"> 
		
			<h3> {{ post.tagline }} </h3>
			<h3> {{ post.title }} </h3>
			{{ preview }}
		</a>

		<h6> Published in {{ post.date | date: "%d/%m/%Y" }} </h6>
	</li>
    {% endif %}

{% endfor %}

</ul>