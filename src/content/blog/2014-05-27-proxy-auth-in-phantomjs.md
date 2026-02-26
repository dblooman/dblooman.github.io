---
title: "Proxy Auth In Phantomjs"
description: "I recently setup a Nginx proxy server on a UK based provider, this is to test UK centric features of the BBC News website. We use AWS for most of our tooling..."
pubDate: "2014-05-27"
---

I recently setup a Nginx proxy server on a UK based provider, this is to test UK centric features of the BBC News website.  We use AWS for most of our tooling, so adding a couple of extra options on AWS to enable this testing seemed like the best approach.  Not quite.

## PhantomJS
The tool I was using to test was [Wraith](https://github.com/BBC-News/wraith), a visual regression testing tool.  We allow users to set command line arguments and this is passed to [PhantomJS](http://phantomjs.org/) on the command line.  One of the available options for PhantomJS is a proxy server and proxy auth, but it isn't that simple.  In testing the --proxy options on it's own, it works fine, but adding auth seems to be a bit more tricky.
Nginx supports basic auth, seeing as that is just a username and password, you'd expect the command to be something like this :

```sh
phantomjs --proxy=192.168.1.1:8080 --proxy-auth=username:password snap.js http://www.bbc.co.uk/news 320 test.png
```

This simply doesn't work, even though using curl and a desktop browser confirmed the proxy to be working.  The next step was to see if [Slimerjs](slimerjs.org) worked, it didn't.  Assuming all Phantomjs does is take the command line argument and pass that as a header, it seemed possible to use my Javascript file to send the credentials.

## In the JS file
By setting the following, Slimerjs authenticated and took the screenshot.  The same could not be said of Phantomjs, it still didn't work.

```sh
page.settings.userName = "user"
page.settings.password = "password"  
```

## The Solution
The solution was to set a custom header, this was successful in enabling access to the proxy.  It seems that for some use cases, the proxy auth works from the command line, but for my situation, the proxy must be set by the command line and the credentials via the javascript file.  

```sh
page.customHeaders={'Authorization': 'Basic '+btoa('user:password')};
```
