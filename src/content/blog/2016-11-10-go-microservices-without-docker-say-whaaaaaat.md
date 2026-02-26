---
title: "Go Microservices Without Docker....say Whaaaaaat"
description: "Docker is pretty cool, lots of tools, big community and it goes quite nicely with Golang Go microservices. My company, FundApps, is a Fintec startup, we writ..."
pubDate: "2016-11-10"
---

Docker is pretty cool, lots of tools, big community and it goes quite nicely with Golang(Go) microservices.  My company, FundApps, is a Fintec startup, we write Go, we write microservices, so why wouldn't we pick Docker?

### Why not Docker

Some recent blog posts have pointed to the technology reasons for not using Docker, but there are also cultural reasons.  Working in a startup, technology choices have wide ranging implications.

If you are the Docker guy in your company, you are the one who drives the change, but what if you leave.  That may be the case for other technology choices, but Docker is not a single piece in your infrastructure, it is your infrastructure.  In a small team of a dozen engineers, a switch to Docker is something that you really have to embrace as a team, it can't just be an Ops thing.

Some engineers will spend hours tweaking a local dev setup, hundreds for vim folks.  So what happens if you, the Docker pioneer, suggest everyone changes a massive part of the way they work and smash Docker into the mix.  Then, changing the production stack to match is also a big commitment.  In a company where there are a couple of you running the entire infrastructure, it can be a difficult decision to introduce lots of new tooling and make it production ready without lots lead time.

For FundApps, there is also a second key issue, we are primarily a dotnet shop.  You know the story by now, big monolith, trying to break it up with Go microservices etc etc.  Working in a dotnet shop often means massive amounts of manual processes, over complicated tooling as well as limited supported for software that runs on Linux/macOS.  Before Docker for Windows/Mac apps came a long, the process of running Docker on Windows was not a smooth process for all.  During a demo of Docker I ran for the team, my Windows machine locked up as I started a container, it wasn't a great insight into the stability of Docker on Windows.  Even now, the experience isn't as smooth as say, macOS.

So we have a 



Telling everyone in the company that you will be migrating in such a large way to a new stack is not a flippant decision, it something that everyone must be on board with.  Microservices and Docker together in production is not a Ops decision or dev decision, its a organisational decision.
