---
title: "Quick Uptime Tests"
description: "We had a huge bug on the live site, http://www.bbc.co.uk/news http://www.bbc.co.uk/arabic , the navigation for our Asia edition was broken. Most of the links..."
pubDate: "2014-12-23"
---

We had a huge bug on the live site, [http://www.bbc.co.uk/news](http://www.bbc.co.uk/arabic), the navigation for our Asia edition was broken.  Most of the links in the navigation were 404ing, we had user complaints and there was a lot of "how did this make it to Live?"  

To understand how such a big bug made it to live, understand that BBC News isn't one website, [it's 32]( http://www.live.bbc.co.uk/ws/languages).  Some of these sites, /news for example, have multiple editions for localised content, Asia being one of them.  This introduces a huge task for link checking everything on a page.  After the fact, I create a tool to make the process of looking for 404's quick and automated, it's called [Linkey](https://github.com/DaveBlooman/linkey).....Naming things is hard.

### Linkey

Linkey was designed to visit a live site, scrape all the links of the page, then remove the domain and non matching links, then hit the matches against a test/sandbox environment.  It would then check the status for then given URL and return it's status code.  If all URL's had a dollar sign appended to it by mistake, it would return a 404 and you knew you had a problem.  

The matches would come from a regex, e.g www.bbc.co.uk/news/uk with the regex of /news would return a result of /news/uk.  A URL of www.bbc.co.uk/sport would be ignored.  Matches would be added to the second domain path, which will then return status codes. The command looks like this

```sh
linkey check http://www.bbc.co.uk/arabic http://www.bbc.co.uk /arabic arabic.md
```
I have used the same domain above, but a localhost example

```sh
linkey check http://www.bbc.co.uk/arabic http://localhost:8080 /arabic arabic.md
```

### Smoke
Linkey was great at what it did, checking if a URL returned a 200 or not, but it was limited to grabbing links from a website.  This meant you didn't know every link you were going to check before hand, enter the Yaml file.  
A simple Yaml file with a base URL and lot of pages with a new smoke feature and we could check the status of hundreds of pages in seconds.  Speed was key here, so parallel HTTP requests are made using [Faraday](https://github.com/lostisland/faraday) and [Typhoeus](https://github.com/typhoeus/typhoeus).  

A config file will look something like this

```yaml
base: 'http://www.bbc.co.uk'

paths:
  - /news/events/scotland-decides
  - /news/england/london
  - /news

```
Which is run like this

```sh
linkey smoke example.yaml
```

The first big usage of this was the Scottish referendum, potentially the biggest news event for our site ever.  This was different than the rest of the website as we were using AWS to serve the main Scotland decides page.  We were testing endpoints for various parts of this AWS based application as well as the front end of the /news website to ensure uptime.  

We ran the job every 20 minutes and when something was down, we knew about it.  This has now changed to fit into our CI pipeline, but just getting the feedback was enough.

### Pingdom?

There are services out there that will tell you when you have a service down, or that your service is returning 500's, so why not just use one of them?  Cost, ease of use and time were a factor in that we needed something that just worked.  It also was helpful to have something that any developer could run locally, ensuring that routes weren't broken.

### Fast

This tool is now used across News after we do a live deploy for the main website, which only happens every 2 weeks.  We push to Test, then Stage then Live, running Linkey after each deploy.  We test around 700 URL's altogether taking less than 90 seconds to check them all.  This sort of testing is simple, but it gives you that extra bit of reassurance that your release is stable.

### Code

You can view the source code for [Linkey here](https://github.com/DaveBlooman/linkey), with PR's welcome.
