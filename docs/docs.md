### Inputs
Input elements can be two-way data bound to a model, which represents a property of the component.

```html
<input type="text" r-model="name" (r-lazy) (r-debounce="500")>

Hello, {{ $this->name }}!
```

> **Note:** Attributes between parentheses are optional.

- `r-model` - component property name to bind to the input.
- `r-lazy` - (optional) update model value only when an action is performed, instead of real-time.
- `r-debounce` - (optional) update model value after a timeout in miliseconds, instead of real-time.

**Supported input types:** `text`, `checkbox`, `radio`, `date`, `datetime-local`, `email`, `number`, `month`, `password`, `range`, `search`, `tel`, `time`, `url`, `color`, `week` and `textarea`.

### Checkboxes and radios
Checkboxes and radio buttons can have a custom value (rather than a boolean) bound to their models when checked.

```html
<input type="checkbox" r-model="accept" (value="Yes")>
```

```html
<input type="radio" r-model="rating" (value="1")>
<input type="radio" r-model="rating" (value="2")>
<input type="radio" r-model="rating" (value="3")>
```

> **Note:** Attributes between parentheses are optional.

#### Multiple choices
Multiple choices checkboxes should be bound to an array model. The component property will be filled with the selected checkboxes custom values.

```html
<input type="checkbox" r-model="services[]" value="Service 1">
<input type="checkbox" r-model="services[]" value="Service 2">
<input type="checkbox" r-model="services[]" value="Service 3">
```

### Selects
Select options can have a custom value bounded to their models.

```html
<select r-model="age">
    <option (value="18")>18 years old</option>
    <option (value="30")>30 years old</option>
    <option (value="60")>60 years old</option>
</select>
```

> **Note:** Attributes between parentheses are optional.

#### Multiple choices
Multiple choices selects should be bound to an array model. The component property will be filled with the selected options (or their custom values, if any).

```html
<select r-model="vehicles[]" multiple>
    <option (value="B")>Bike</option>
    <option (value="C")>Car</option>
    <option (value="A")>Airplane</option>
</select>
```

> **Note:** Attributes between parentheses are optional.

### Actions
Some events in elements can be bound to call a method from the component controller.

```html
<button r-click="load()" (r-prevent)>Click me!</button>
```

> **Note:** Attributes between parentheses are optional.

- `r-click` - full method signature to call from the component controller. You can also pass parameters in the function.
- `r-prevent` - (optional) prevent default browser action of the event.

#### Supported actions
Current supported actions are:

- `r-click` - triggered on element click.
- `r-submit` - triggered on `<form>` element submit.
- `r-focus` - triggered when an element gains focus.
- `r-blur` - triggered when an element loses focus.
- `r-hover` - triggered when the mouse hovers an element.
- `r-leave` - triggered when the mouse leaves an element.
- `r-enter` - triggered when the **Enter** key is pressed in an input element.
- `r-tab` - triggered when the **Tab** key is pressed in an input element.

#### Magic methods
Some predefined methods are:

- `$refresh()` - refreshes the component render, without performing any action.
- `$set('property_name', 'value')` - sets a property value in the component.
- `$toggle('property_name')` - toggles a boolean property between true and false.

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