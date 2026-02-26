---
title: "Mobile Network Traffic Inspection"
description: "In this post, i will talk about how to view network traffic and the HAR HTTP Archive file. This is useful for doing several things, my initial intention was..."
pubDate: "2012-11-15"
---

<p>In this post, i will talk about how to view network traffic and the HAR (HTTP Archive) file. This is useful for doing several things, my initial intention was to discover network traffic from mobile devices.  This was something i wanted to view in order to find out whether our vary headers and stats were correctly being logged, but there is also an interesting way to measure performance.</p>
<p>Requirements</p>
<ul><li><span>OSX</span></li>
<li><span><a href="http://www.tcpdump.org/">TCP Dump</a></span></li>
<li><span><a href="http://pcapperf.appspot.com/">PCAP</a></span></li>
<li><span><a href="https://github.com/andrewf/pcap2har">PCAP2har</a></span></li>
</ul><p>The basic usage is to capture the HAR file, you will use tcpdump to capture TCP traffic and save it to PCAP file. The website above, you guessed it, shows you the PCAP file in it's HAR form. This will allow you to view the HAR timeline, request headers, UA string etc.</p>
<p>Run this command in terminal. This takes the tcpdump from my bridged adaptor, the best way to do this is to share your wired conniption through your wireless and connect any mobile device to the new wireless access point.</p>
<pre class="prettyprint">sudo tcpdump -i bridge0 -n -s 0 -w nameoffile.pcap tcp or port 53</pre>
<p>Once you have done all of you browsing, in some cases this will simply be loading a web page, hit control + C and the file is created in the directory you are in. The next step either requires you to have a local instance of the <a href="https://github.com/andrewf/pcap2har">HAR viewer </a>on your machine, or use the <a href="http://pcapperf.appspot.com/">online version</a>. Which ever you decide to use, the output will seem very familiar to most.</p>
<p>By using this tool, we can see how each device loads the page, where you could improve upon for certain devices and what, if any, are the issues with your website.</p>
<p>While this isn't as good as Chrome for Android that shows you all of this in real time, for very old devices, this is the best way to inspect your traffic.</p>
