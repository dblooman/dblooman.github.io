---
title: "What Am I Copy And Pasting Into My Dockerfile"
description: "It's pretty common that when you have no idea what you are doing, you want things to \"just work\". Docker, and by extension, Linux, have a world of documentat..."
pubDate: "2016-12-27"
---

It's pretty common that when you have no idea what you are doing, you want things to "just work".  Docker, and by extension, Linux, have a world of documentation, but often it's the little things that trip people up.  When installing software into your Docker image, something may not work, a C library, some kind of XML error, something with a .so file.  You go onto a forum and see loads of commands and packages not in your Dockerfile, add them in and then it works, but you have no idea what you did.   Let's look at what you might be copying.

### From the top

What is that Docker image you're using, Ubuntu, right? You may see `FROM buildpack-deps:jessie-scm`, or `buildpack-deps:jessie-curl`, which both are based on the Debian distribution of Linux.  A couple of years ago, there was a lot of people who felt it was best to start with a clean image, no unneeded packages.

However, it is likely you are going to want curl, wget or maybe a programming language installed, so there are some helpful images that bootstrap most commonly used packages.  `buildpack-deps:jessie` is used by Ruby for example, `buildpack-deps:jessie-scm` is used by the Go image.  

Rather than write a long Dockerfile with lots of packages, or use an image with packages you might not need, choosing a buildpack can offer a faster way to run your code with just the right amount of packages to worry about.

### Random ENV's

So what is `export DEBIAN_FRONTEND=noninteractive` I have been seeing.  Well, it's a way of preventing interactive installers from blocking installation of software.  This is usually followed by more environment variables that set the answers to the questions you've just blocked from appearing.

### Game SET and -x?

Bash, that thing that shits all over powershell, has many ways to ensure your Docker build is a success.  Often, when you have a long list of commands chained together, you want to exit the Docker build when something fails so that you don't waste time, this is achieved through `set`.

I have seen `set -eux`, is this the norm?  

```
set -e
```

The most common way to exit a chain, or pipeline, such as `install foo && install bar`, is to use e, which means exit immediately.

By doing this, you will get much faster feedback from broken builds.

```
set -u
```

The `-u` option is nice if you want to exit when a variable hasn't been set.  This is useful for those who make a lot of typos.  In a shell script, if you use `-u`, an `echo $FOOBAR` will actually exit 1 if it isn't set.  The alternative is that your echo statement prints a blank line and exits 0.

```
set -x
```

This is more of a debugging tip, so is something of an optional flag.  `-x` will output a trace of your previous command, so for example,

```bash
#!/bin/bash

set -ux
echo "testing"
echo $DAVE
```
Lets run it

```bash
~> ./demo.sh  
+ echo testing  
testing  
./demo.sh: line 5: DAVE: unbound variable  
```

This will error, but at least we know that our first step was a success.  I use this in most of my shell scripts.

### yum yum yum....APT!

So now we are at the main bit, the part where you may have about 40 &&'s chaining your commands together.  But what is `--no-install-recommends` doing?  Should I know what epel-release is?

If you are familiar with Debian or Centos, you will probably not know the intricacies of the package managers, apt and yum respectively.  They offer a lot of a packages, but there are some key things to note.

```
yum -y install epel-release
```
**yum** - The package manager CLI  
**-y** - Accept all licenses and prompts  
**install** - Install software  
**epel-release** - Extra Packages for Enterprise Linux, allows installation of lots of open source packages  


_Now APT_

```
apt-get update && apt-get install -y --no-install-recommends
```

**apt-get** - CLI tool for installing packages  
**update** - Retrieves new lists of packages  
**&&** - Chain commands if output from first is a success  
**install** - Install software  
**-y** - Accept all licenses and prompts  

So `--no-install-recommends` is an interesting one.  APT can suggest packages and recommend packages, an example would be you want to install a package to write a file a format, so would be recommended a tool to read that format.  If you don't want this software, which in a Docker image, you probably don't, add this to your install command.

### Cleaning Up

This is usually the following two commands for Debian and Centos based distributions

```sh
apt-get clean

yum clean all
```
This just removes downloaded archives and caches, useful if you are about to push your image up and every byte counts.

Also, `rm -rf /var/lib/apt/lists/` on Debian can be used to clean apt package lists.  When you apt-get update, you download a long list of packages, you don't need this if you are finished installing software for good.  Next time you run apt-get update, you can get a new list.


### The more you know

Some of this is just the basics of Linux, but for those developers who have never used Linux before, it can be a big task to learn this, as well as deploying your code inside a container.  Hopefully, as you go forth into the Docker ecosystem, you will now have a little more information to help install just the software you need for your code to run.
