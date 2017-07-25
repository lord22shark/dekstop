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
* NodeJS - use a version that support ES6

## SETUP

After cloning this repository, you must run:

```bash
npm install
```

## When my text is updated?

1. When you press `Ctrl + S`;
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

> Schedule blocks will create alerts for its content. The date **MUST** be in the below format. Example: 2017-07-24 20:38

```
/@ (yyyy-mm-dd HH:MM:SS)

...

(@\
```

## And how I run this stuff?

After cloning the repository, open a Terminal or Command Prompt and type the following command in the root directory:

```bash
node index.js
```

and then lauch your browser and go to `http://localhost:4000`.

The data folder, by default, is `../data`... in another words, a sibling directory of this repository. I put it outside of the project to avoid git submodules and to allow more control of your source files.

> There are **2** ways of changing this folder:

1. By ARGS:
    
    ```bash
    node index.js /path/to/my/desired/folder
    ```
2. By ENVVAR:

    ```bash
    SET DEKSTOP_PATH=/path/to/my/desired/folder && node index.js
    ```