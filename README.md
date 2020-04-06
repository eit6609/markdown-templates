# Markdown Templates

Markdown Templates is a natural template engine for markdown.

The concept of "natural template" comes from [Thymeleaf](https://www.thymeleaf.org/), a Java template engine for HTML.

Quoting the Thymeleaf homepage:

> Thymeleaf's main goal is to bring elegant natural templates to your development workflow — HTML that can be correctly
> displayed in browsers and also work as static prototypes, allowing for stronger collaboration in development teams.

Run this to install:

```bash
npm i @eit6609/markdown-templates
```

## Natural Templates for Markdown

In practice, the templates of Markdown Templates are valid markdown files, that can be rendered correctly
by the preview of your favourite markdown editor. They even have the .md extension.

But Markdown Templates brings the concept of natural templating a bit further: the preview can be used to actually *guide
you* while you are writing the template: if it looks good, you are doing good.

This is the main (or the only) reason for the existence of this template engine, because of course for markdown you can use any of the template engines out there that are not dedicated to a specific language, such as the Mustache family, EJS, you name it.

What enables the whole thing is the fact that markdown *has syntactic constructs dedicated to the display of code*. You know them:

* inline code, like \`this\`
* code blocks, created using tabs or spaces
* fenced code blocks, opened and closed by \`\`\`

Now, what about *executing* this code?

We could:

* replace the inline code with its evaluation
* use the code blocks to control the result with conditionals and loops

Markdown Templates does just that.

## A Quick Example

Given this template:

```markdown
Hello `name`!

Your basket contains the following items:

    for (let i = 0; i < items.length; i++) {

* `items[i]`

`-`

    }
    if (freeShipping) {

Your order is eligible for free shipping.

    }
```

and this context:

```js
{
    name: 'Bob',
    items: ['scissors', 'paper', 'rock'],
    freeShipping: true
}
```

the result is:

```markdown
Hello Bob!

Your basket contains the following items:

* scissors
* paper
* rock

Your order is eligible for free shipping.

```

The preview of the template could look like this:

---
Hello `name`!

Your order contains the following items:

    for (let i = 0; i < items.length; i++) {

* `items[i]`

`-`

    }
    if (freeShipping) {

Your order is eligible for free shipping.

    }
---

The preview displays neatly and nicely the difference between the static and the dynamic parts, in a *natural* way.

Moreover, there are no ugly `{{` and `}}` or even uglier `<%` and `%>`.

By now you'll have at least a couple of questions:

* what if I want an inline code or code block to actually *display* the code, and not execute it?
* what is that `-` that you put before the closing bracket of the `for` loop?

The answers are in the following section.

## Template Reference

### Code execution

This is the way the code is executed:

* expressions inside an inline code, like \`blue + red - 1\`, are substituted by their evaluation.
* the code blocks control the appearing in the output of the text they enclose. Since to close a code block a blank line
  is needed, that line is considered part of the code block and will not go to the output.

#### Escaping code

Instead of leaving to the programmer the burden to mark the code to execute, this engine reverse the perspective and
asks the programmer to mark the code that he or she does *not* want to be executed.

The rules fore this escaping are:

* inline code is not substituted if it starts with `!`.
* a block code is not executed if the first non-blank character of the line is `!`.
* the code inside fenced code blocks is never executed and it does not need to be escaped. However, inside the code
  fence, the above rules still apply.

#### Example

This is the template:

~~~markdown
Don't substitute here: `!name`. But substitute here, `name`.

    if (bonus) {

This is a bonus paragraph.

    }

```
This is static code, but you can still substitute things, `name`.
```

    !this.is.static.code()

And this is the end.

~~~

This is the data:

```js
{ name: 'Bob', bonus: true }
```

And this is the output:

~~~markdown
Don't substitute here: `name`. But substitute here, Bob.

This is a bonus paragraph.

```
This is static code, but you can still substitute things, Bob.
```

    this.is.static.code()

And this is the end.

~~~

### Separator

There's only one drawback using code blocks like this: you need to add a non empty paragraph to separate the text from
the code block, but most of the times this extra paragraph is not something that you want in the output.

Therefore the engine understands a special paragraph that contains only the characters backtick-hyphen-backtick. This
paragraph acts as a no-op and it's treated like this:

* the empty line preceding the no-op, the no-op itself and the empty line following it are ignored.

We could choose just any uncommon string, but an inline code is more suitable because it is highlighted in the preview.

#### Example

```markdown
    for (let i = 0; i < items.length; i++) {

* `items[i]`

`-`

    }

```

The no-op is needed because the only way to separate the list item from the closing bracket is with a non empty
paragraph. This special non empty paragraph will do the job without appearing in the output, which is something
like:

```markdown
* scissors
* paper
* rock

```

Again, the preview will tell you that there is something wrong if you are not separating the code block from the text
correctly. This template:

```markdown
    for (let i = 0; i < items.length; i++) {

* `items[i]`
    }

```

will be rendered like this:

---
    for (let i = 0; i < items.length; i++) {

* `items[i]`
    }

---


Add the no-op and you'll see the preview showing something that looks right:

---
    for (let i = 0; i < items.length; i++) {

* `items[i]`

`-`

    }

---

## API Reference

### `compile(template: string, options?: object): function(locals: string): string`

This function gets a template and it compiles it into a function that, invoked with the data as its parameter,
will generate the output.

The function code is enclosed in a `with` block, to let you access the properties of the parameter directly.

Parameters:

* The `template` parameter contains the template.
* The `options` parameter is an object that can have the following properties:
    * `with`, boolean, optional, default `true`. With `false` you can disable the generation of the `with` block if you
      incur in one of the [problems](https://2ality.com/2011/06/with-statement.html) it may give.
    * `locals`, string, optional, default `locals`. If you disable the `with` block generation, you need to access
      explicitly the parameter of the function. The default name of the parameter is `locals`, but you can change it
      with this option.
    * `debug`, boolean, optional, default `false`. If `true`, it triggers the display (with `console.log()`) of the
      generated function.

### `compileFile(fileName: string, options?: object): function(locals: string): string`

Exactly like `compile()`, but it takes a file name as first parameter and it (synchronously) reads the template from the
file.
