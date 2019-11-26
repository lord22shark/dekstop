# dekstop
Dekstop is a sandbox, a draft text file with an associated parser that shows an enhanced view and commits, with git, every update. The name "Dekstop" is a prank with brazilians that do not know how to speak Desktop.

This is a "simple" notepad. Do you know that `.txt` file or the "uncloseable" tab in Sublime Text that you use for notes... clipboard... rapid annotations... code snippets... drafts... schedules... that in the end become a monstruous sandbox you do not want to delete?

For this reason I build this **Dekstop**. But what are the points?

1. I use **git** to control every update you make in the sandbox;
2. If you have a remote repository (Bitbucket, GitLab, GitHub) you may configure and, manually, use git push;
3. Runs locally;
4. It's made just for your use...
5. It has 3 types of blocks: **context**, **code** and **schedule**
6. Uses websocket
7. Written in JavaScript

## REQUIREMENTS

To run this thing you need:

* GIT
* NodeJS - use a version that supports ES6

## SETUP

After cloning this repository, in its folder (root), you must run:

```bash
npm install (or yarn install)
```

This project use .env and the following variables must be set:

```bash
DEKSTOP_PORT=5500
DEKSTOP_PATH=.data
DEKSTOP_GIT_NAME=My Git Name
DEKSTOP_GIT_EMAIL=mygit@email.com
```bash

You can set these environment variables or create a `.env` file in the root of this project.

## When my text is updated?

1. When you press `Ctrl + S` `In this scenario, git add && git commit will be called.`;
2. When you press *Return* or *Enter*

    ```javascript
    ((key === 13) || (key === 10))
    ```
3. After typing **3** times the space bar

## And how are these **blocks**?

### Context Blocks

> Only texts inside these blocks will be parsed. Everything outside of it will be ignored. Please... avoid nested blocks. I still do not know what can happen :-(

```
/@ [NAME_OF_CONTEXT_BLOCK]

...

[@\
```

### Code Blocks

> I use [highlightjs.org](https://highlightjs.org/) for code blocks. So you can choose among its supported languages.

```
/@ {language}

...

{@\
```

### Schedule Blocks

> Schedule blocks will create alerts for its content. The date **MUST** be in the below format. Example: 2017-07-24T20:38-03:00

```
/@ (yyyy-mm-ddTHH:MM:SSZ)

...

(@\
```

## And how I run this stuff?

After cloning the repository, open a Terminal or Command Prompt and type the following command in the project root directory:

```bash
node index.js
```

and then lauch your browser and go to `http://localhost:5500`.

The data folder, by recommendation, is `./data`... in another words, a child directory in the root this repository. I put it inside of the project considering that *.data* is defined in *.gitignore*.

I set no default values. Please do not forget to set them.

You could use `nodemon` and `forever` to run this project too.

# CHANGELOG

1. **2017-08-25 11:23:** added the clipboard function. Still needs some adjustments (like clipboard by active section). To use it, press Ctrl + Shift + #, being # a number between 0 and 9. Another included feature is `viewOnlyMode`. You can open this in another machine, another browser with `/#view`. It is quite useful if you want a clipboard between 2 or more machines.
2. **2018-01-02 17:45:** removed Windows specific dependencies, allowing to run with Forever
3. **2019-11-26 00:11:** New Version! :-D (...) I know... there a lot of things to explain... and some code adjustments to do...
