### Inputs
Any kind of input element can be two-way data binded to a model, which represents a property of the component.

```html
<input type="text" r-model="name" r-lazy r-debounce="500">
Hello, {{ $this->name }}!
```

- `r-model` - binds the input directly to a component property.
- `r-lazy` - update model value only when an action is performed.
- `r-debounce` - update model value after a timeout in miliseconds.

### Checkboxes and radios
Checkboxes and radio buttons can have a custom value (other than a boolean) binded to their models when checked.

```html
<input type="checkbox" r-model="accept" r-value="Yes">
```

```html
<input type="radio" r-model="rating" r-value="1">
<input type="radio" r-model="rating" r-value="2">
<input type="radio" r-model="rating" r-value="3">
```

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
<button r-click="load()" r-prevent>Click me!</button>
```

- `r-click` - full method signature to call from the component controller.
- `r-prevent` - prevent default action of the event.

#### Magic methods
Some predefined methods are:

- `$refresh()` - refreshes the component, without performing any action.
- `$set('property_name', 'value')` - sets a property value in the component.