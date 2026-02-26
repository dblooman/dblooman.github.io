---
title: "Screen Recording In Android"
description: "Sometimes you need to show someone something on a phone, words are just not good enough. With testing moving more to mobile, having the ability to show a col..."
pubDate: "2013-11-26"
---

Sometimes you need to show someone something on a phone, words are just not good enough.  With testing moving more to mobile, having the ability to show a colleague the issue has become a little harder.  Google introduced screencasting in Android 4.4, a way to record everything you do on screen.  Great, but that makes a big video that is difficult to look at on Github, so lets convert that video into a GIF.

For this you will need the Android SDK, FFMPEG and ImageMagick.  Install on Mac by using Homebrew.  You will need and Android 4.4 phone to make this work, these instructions are also tailored for OSX system.

Install binaries
<pre>
brew install android-sdk imagemagick ffmpeg --devel</pre>

With terminal open and your android 4.4 phone plugged in, use the following commands, swapping out the file name as you see fit.  

To start the recording, use the adb shell screenrecord command </pre>

<pre>adb shell screenrecord  /sdcard/pull_request.mp4</pre>

You can also change the bit rate from 4mbps up to 8mbps by using

<pre>adb shell screenrecord --bit-rate 8000000 /sdcard/pull_request.mp4</pre>

Hit control + c to stop recording.

When you are done, pull the video off by using

<pre>adb pull /sdcard/pull_request.mp4</pre>

This is now the video file we will work with.  If you want to delete lots of files you didn't use, you can `adb shell` in terminal to access the phones storage.


# Converting the video to GIF

<pre>ffmpeg -i pull_request.mp4 -vf scale=360:-1 -r 5 output.gif </pre>

Lets break it down,

ffmpeg is the application we are using

pull_request.mp4 is the file name of the video

-vf is the video filter graph for setting FPS and scale

scale=360:-1 is the WxH, so 360 as that is 1/4 the width of the Nexus 5, this is to reduce file size.  Using -1 sets the aspect ratio automatically for us based on the input video size, 16:9 in our case, meaning less guess work.

-r is the frame rate of the GIF, I have used 5, but you could go to 6 or 7.

output.gif is our finished file name.


# Compressing the GIF

This is the hard part, finding a balance for the quality Vs file size.  We ended up with a 3.5MB GIF from a 20 second video clip, using Imagemagick, we got that down to 1.3MB, but the results were not that useful.  Instead, I have decided on a 10% fuzz to give a nice result, but still reducing file size to 2.1MB, meaning it is roughly 100k per second.  

<pre>convert output.gif -fuzz 10% -layers Optimize final.gif</pre>

I decided not to embed the GIF, save you the download, if you want to see it, click the [link](http://imageshack.com/a/img29/3360/0zqt.gif)
