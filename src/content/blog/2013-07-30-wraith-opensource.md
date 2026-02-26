---
title: "Wraith Opensource"
description: "Today we are announcing the release of a front end regression testing tool called Wraith . &nbsp;This tool is something we have been using for the last 6 mon..."
pubDate: "2013-07-30"
---

<p>Today we are announcing the release of a front end regression testing tool called <a href="https://github.com/BBC-News/wraith">Wraith</a>. &nbsp;This tool is something we have been using for the last 6 months, it has proven invaluable in testing CSS changes, both deliberate and unintentional.</p>
<p>Download Wraith here :&nbsp;<a href="https://github.com/BBC-News/wraith">https://github.com/BBC-News/wraith</a></p>
<p>This tool came about as we continued to see small changes from release to release, as more teams joined the project, small front end bugs cropped up more frequently. &nbsp;Our solution was to compare screenshots of pages, at the pull request level and when merged into master. &nbsp;This process produces fewer bugs and unintended changes, while also being able to ensure intentional changes appear correctly.</p>
<h2>How it works</h2>
<p>The tool is 2 parts, the capturing, using a headless browser and the comparing, using <a href="http://phantomjs.org/">Imagemagick</a>. &nbsp;<a href="http://phantomjs.org/">PhantomJS</a> is a headless browser designed exactly for these types of tasks. &nbsp;It doesn't have a UI, all your settings are applied on the command line, or in our case, in snap.js. &nbsp;We can use PhantomJS to capture multiple resolutions, so RWD testing is made much easier. &nbsp;An alternative is&nbsp;<a href="http://slimerjs.org/">SlimerJS</a>, this is another headless browser. &nbsp;It is not out of the box headless on some operating systems, so is not as simple to setup as PhantomJS. &nbsp;The good thing is that it is essentially a clone of PhantomJS, so all settings will work with both browsers. &nbsp;</p>
<p>The main difference between the two browsers is webkit and <a href="https://developer.mozilla.org/en-US/docs/Mozilla/Gecko">Gecko</a>, PhantomJS being Webkit and SlimerJS being Gecko. &nbsp;This means that you can test across two rendering engines. &nbsp;By default, we have set up Wraith to use PhantomJS, this is due to the extra configuration to make Slimer headless. &nbsp;</p>
<p>Using Wraith, you can see where your website really breaks by starting to put in resolutions you don't normally consider. &nbsp;Each screenshot has it's file name comprised of the resolution and the environment you're grabbing the screenshot from, the individual web pages will label the folder so all your screenshots will be grouped. &nbsp;</p>

<img src="http://media.tumblr.com/6cf7be1ea8c922595df53c0a58f2f52f/tumblr_inline_moafeq77KP1qz4rgp.png" class="img-responsive" alt="folders">

<p><span>-All the screenshots in their folders</span></p>
<p>Wraith captures images from 2 domains, in most cases a live website and then a local or staging environment. &nbsp;This is where most of the other tools I looked didn't fit our needs, they used historical base line images instead of a live site. &nbsp;Not only does this not take into account other teams or external dependencies, it also assumes that you are using static data. &nbsp;</p>
<p><span>For News, that is not really possible, we use our sandboxes, test, stage and live environments for comparison. By using 2 domains, even if a dependency changes, e.g a twitter module, when you run the comparison, you will be using the latest version of the dependency. &nbsp;This wont flag up a change compared to a baseline with an old version of a twitter module that would. &nbsp;This may not be for those of you who are going to build a page and leave it for 6 months, but for a ever changing codebase like news, baseline images are out of date almost every day. &nbsp;</span></p>
<h2>I've got the Magick...</h2>
<p>Once the 2 images have been captured, they are then compared and a third diff image is output. &nbsp;The third image shows changes in blue, even 1px changes are shown, so the accuracy is excellent. &nbsp;For this process, we use Imagemagick.</p>
<p>Imagemagick is a very powerful tool for image work, so comparing images is a snap. &nbsp;We looked at other tools for comparing the images, but we found that there was an inherent problem with the way we were capturing images, anti-aliasing. &nbsp;Anti-aliasing caused changes to be shown where there were none, so our diff image wasn't that valuable. &nbsp;Imagemagick was our choice of tool because it takes care of the AA issue for you, but setting a fuzz of 20%, we were able to eliminate the AA differences. &nbsp;This setting was found by trial and error, so I suggest you fine tune this to your own preference. &nbsp;The fuzz parameter is set in the Rakefile.</p>


<img src="http://media.tumblr.com/c5bf7caefde043ee7532b641c7f0e157/tumblr_inline_moaf774b5i1qz4rgp.jpg" class="img-responsive" alt="diff">
<blockquote>
  <p>-Two pages with the diff result</p>
</blockquote>
<p><span>Once we have the 3 images, we can start to review, this is simply a process of going through the diff images looking for lots of blue. &nbsp;If you don't like the blue colour, you can change it, but blue seems distinctive and should be easier to see on a white canvas. &nbsp;This is the only manual part of the process, but it is not something that takes that long. &nbsp;The total amount of time to capture the images and compare will be based on your Internet connection and the speed of your computer, but we usually capture 200 images and by the time we have our diffs, it has taken around 10 minutes. &nbsp;</span></p>
<h2>Conclusion</h2>
<p><span>The amount of time spent testing for CSS regressions can be lengthy if you don't automate, looking at devices and different browser resolutions can be a drag on testing. &nbsp;By using this tool, we have cut our testing time down dramatically, with fewer bugs making there way into master and the live site.</span></p>
