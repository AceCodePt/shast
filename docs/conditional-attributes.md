# Conditional attributes and ids

Just as `display: flex` unlocks `gap` in CSS, an HTML attribute value can
unlock further attributes on the **same element**. (An HTML attribute is not a
fact a child element inherits, so there is no `children` slot - and no `self`
slot either, since a slot named `self` would imply a `children` counterpart. The
value maps straight to the attributes it unlocks.) In the registry an attribute
is either a DSL string (unconditional) or a map from each possible value to what
that value unlocks:

```ts
htmlAttributesConfig: htmlAttributeConfig(SUPPORTED_KEYWORDS, {
  id: {
    undefined: {}, // id is optional
    "todo-42": { "data-kind": "'literal'" },
    "`todo-${number}`": { "data-kind": "'pattern'" },
  },
}),
```

With `input` declaring `checked` under `type: checkbox | radio`, writing
`<input type="range" checked>` fails at both walls with
`'checked' requires type: checkbox | radio`, while `<input type="checkbox"
checked>` is accepted. The shipped vocabulary gates other elements the same way:
`button[type]` unlocks the form-override group for `submit` (and for an omitted
`type`, which defaults to submit), `form[method]` unlocks `enctype` only for
`post`, and `track[kind]` unlocks `srclang`/`label`/`default` for the subtitle
kinds. An omitted gate contributes its `undefined` arm, so omitting a gate still
unlocks whatever its default value implies. A value key written as DSL - a
`<token>` or a backtick template such as `` `todo-${number}` `` - is a **pattern
key**: resolution is literal first, a value matching two keys is an error, and a
value matching none reports a message about the value. Optionality is declared
with an `undefined` arm, exactly as `| undefined` does for a flat attribute.
Where an unlocked attribute's declared type is exactly one literal,
`renderComponent` fills it in when omitted; writing it is allowed, writing a
different value is an error at both walls.

This is the third structural binding, alongside `> title` (a named child) and
`&.active` (a class declared on the element). `ComponentIds<T>` is the
structural binding for ids - the receivers the behaviour layer dispatches on,
which do not move when a node is re-nested:

```ts
type Ids = ComponentIds<
  typeof component,
  typeof SUPPORTED_KEYWORDS,
  typeof commonHTMLAttributes,
  typeof commonHTMLTags
>;
// { "todo-42": { "data-kind"?: "literal" } }
//   | { "todo-7": { "data-kind"?: "pattern" } }
```

It collects every literal `id` written in the component with the values its
resolved key declares; a widened `string` id contributes nothing, duplicate ids
merge, and a component with no ids resolves to `never`.
