---
title: "Game Client Web Browsers"
description: "I recently got Battlefield 4, an intensive first person shooter with high detail graphics and enough shooting to satisfy any teenage angst. I purchased the g..."
pubDate: "2013-11-10"
---

I recently got Battlefield 4, an intensive first person shooter with high detail graphics and enough shooting to satisfy any teenage angst.  I purchased the game on the PC, meaning I am locked into EA's(Electronic Arts) distribution software called [Origin](https://www.origin.com/en-gb/store/-ANW.html).  This software enables buying, trading, chatting, it also has a social aspect in the form of profile pages, but it also has an inbuilt web browser.  This browser isn't actually accessible from the Windows desktop, it is designed for use within the game itself.  

<img src="http://media.tumblr.com/ba9dc7aecb527ff43985b7660a8ed386/tumblr_inline_mw2d5vGrm21r7w4ky.png" class="img-responsive" alt="Screenshot">

This is not a new concept, the main rival in this space is [Valve](http://store.steampowered.com/), with a similar distribution software called Steam.  Steam also has a browser, similar to Origin, and is also only accessible inside a running game.  The browser is accessible via a shortcut key which displays an overlay, the overlay exposes a slue of features for the now dead/bored gamer.  These browsers are meant to eliminate the need to leave the game and return to the desktop, which in theory, should lead to extra sales of in-game content.  In any case, these browsers exist, but I have never actually thought about what they are capable of, they always seemed ok, but I took some time to find out what's under the hood of these browsers.

## The Browsers

## Steam
A quick look at the UA string says a lot about where these browsers started, for Steam, it is Chromium, or more importantly, [(CEF)Chromium embedded framework](https://code.google.com/p/chromiumembedded/).  This version of Chromium is quite old, version 18 with Web kit build 535.19, though the CEF doesn't get the same treatment as regular Chromium in update terms.  There is also a reliance on Valve to update Steams CEF to the latest, another barrier to the latest standards.  The general experience of Valve's browser is good, flash can be installed if the user decides to, with generally OK performance.  There is a tab interface, but that is about all it does have.  It wont win any speed contests, sometimes it can be slow to load big pages.  Responsive sites work as expected, though there is another dynamic to web browsing in Steam, the viewport.  

Although you may have a 24 inch screen with HD resolution, some gamers like to run low resolutions to get the best performance, some will even run in a different aspect ration.  What this can mean is a 1920x1080 display is reduced to a 800x600 viewport, leaving responsive sits below what some would call "desktop" resolutions.  Steam respects the resolution of the game and limit the browser accordingly, so even on a large desktop monitor, responsive websites have an important home.

The scores from this browser follow from [Anna Debenham's](https://twitter.com/anna_debenham) [console browser scores](http://console.maban.co.uk/), using Acid3, CSS3test and HTML5test.

CSS3 51%  
Acid3 100%  
HTML5test [354](http://beta.html5test.com/s/e322c81c5bf15a0e.html)

UA String : Mozilla/5.0 (Windows; U; Windows NT 6.2; en-US; Valve Steam GameOverlay/1383158641; ) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Safari/535.19

## Origin

Origin is little less forthcoming about it's origins, yes, I went there.  It points to a custom build of web kit, 534.34, while actually indicating it is Safari.  The interface is slightly different from Steam, but overall is a basic browser with tabs.  Flash can be installed in Origin too.  As both clients allow for chatting in the overlay, resizable browsers are key, which is very convenient for responsive sites.  Origin seems to have the same limiting in-game performance as Steam, scrolling and general use can have a element of lag to it.  If you stick to Facebook, Twitter and BBC News, you should be fine, but some parallax sites were noticeably janky.

Scores :

CSS3 45%  
Acid3 100%
HTML5test [270](http://beta.html5test.com/s/66bc031c5bf22f76.html)

UA String : Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/534.34 (KHTML, like Gecko) Origin/9.3.10.4710 Safari/534.34

## Testing

Some of the more interesting results came from simple tasks such as loading images, both browsers had strange results.  On websites like the Guardians new responsive site, Steam simply gave up trying to load javascript, so only a core experience was usable.  In Origin, images loaded, but the browser had serious issues with layouts of some responsive sites, they just didn't look right.  

<img src="http://media.tumblr.com/b7047c3c66e927a10174c571cf2fd634/tumblr_inline_mw2d55SURE1r7w4ky.png" class="img-responsive" alt="Guardian">

Video was interesting, Origin behaved itself and didn't attempt to load HTML5 video, but Steam did, leading to a disappointed user experience.  On BBC News for example, clicking the video would remove the poster image and leave a disappointing non functional video player in place.  
<img src="http://media.tumblr.com/3ad25ef48d199df18a7dcf54900a9e74/tumblr_inline_mw2d3vI3001r7w4ky.png" class="img-responsive" alt="Steam">

Scroll bars were also an issue for Steam, lets hope an important button isn't hidden away.

## Conclusion

In-game browsers have been around since 2010, but Steam recently hit 60 million users and Origin is growing rapidly, though it is likely that Origin and Steam share a lot of users.  This growth could lead to yet another issue for more mainstream websites, testing browser compatibility for an audience that is typically quite good with a computer and it's capabilities.

I suppose the best part about in-game browsers for Steam and Origin is that they are limited to PC's on a desk with a keyboard and mouse...........[sigh](http://store.steampowered.com/livingroom/SteamOS/)
