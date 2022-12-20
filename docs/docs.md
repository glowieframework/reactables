### Inputs
Input elements can be two-way data binded to a model, which represents a property of the component.

```html
<input type="text" r-model="name" (r-lazy) (r-debounce="500")>
Hello, {{ $this->name }}!
```

> **Note:** Attributes between parentheses are optional.

- `r-model` - binds the input directly to a component property.
- `r-lazy` - (optional) update model value only when an action is performed, instead of real-time.
- `r-debounce` - (optional) update model value after a timeout in miliseconds, instead real-time.

### Checkboxes and radios
Checkboxes and radio buttons can have a custom value (other than a boolean) binded to their models when checked.

```html
<input type="checkbox" r-model="accept" (r-value="Yes")>
```

```html
<input type="radio" r-model="rating" (r-value="1")>
<input type="radio" r-model="rating" (r-value="2")>
<input type="radio" r-model="rating" (r-value="3")>
```

> **Note:** Attributes between parentheses are optional.

#### Multiple choices
Multiple choices checkboxes should be binded to an array model. The component property will be filled with the selected checkboxes custom values.

```html
<input type="checkbox" r-model="services[]" r-value="Service 1">
<input type="checkbox" r-model="services[]" r-value="Service 2">
<input type="checkbox" r-model="services[]" r-value="Service 3">
```

### Actions
Some events in elements can be binded to call a method in the component controller.

```html
<button r-click="load()" (r-prevent)>Click me!</button>
```

> **Note:** Attributes between parentheses are optional.

- `r-click` - full method signature to call from the component controller. You can also use parameters in the function.
- `r-prevent` - (optional) prevent default browser action of the event.

#### Supported actions
Current supported actions are:

- `r-click` - button click
- `r-submit` - form submit
- `r-enter` - enter key pressed
- `r-tab` - tab key pressed

#### Magic methods
Some predefined methods are:

- `$refresh()` - refreshes the component, without performing any action.
- `$set('property_name', 'value')` - sets a property value in the component.

### Repeats
You can automate a component method to run repeatedly in an specific interval of time.

```html
<div r-repeat="increment()" r-interval="1000"></div>
```

- `r-repeat` - full method signature to call from the component controller. You can also use parameters in the function.
- `r-interval` - interval in miliseconds to run the function.

### Defer methods
You can program a method to run only after the component is rendered.

```html
<div r-init="ready()" (r-timeout="1000")></div>
```

> **Note:** Attributes between parentheses are optional.

- `r-init` - full method signature to call from the component controller. You can also use parameters in the function.
- `r-timeout` - (optional) timeout in miliseconds to wait before running the method.