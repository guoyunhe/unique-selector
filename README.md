# @guoyunhe/unique-selector

Compute shortest unique selector for any DOM element in document

> Forked from [@cypress/unique-selector](https://www.npmjs.com/package/@cypress/unique-selector), which unluckily doesn't support ESM

## Installation

```bash
npm i -S @guoyunhe/unique-selector
```

## Usage

```js
import unique from '@guoyunhe/unique-selector';

const button1 = document.createElement('button');
button1.classList.add('btn');
document.body.append(button1);
const button2 = document.createElement('a');
button2.classList.add('btn');
document.body.append(button2);
const link = document.createElement('a');
document.body.append(link);

unique(button1); // button
unique(button2); // a.btn
unique(link); // a:nth-child(3)
```
