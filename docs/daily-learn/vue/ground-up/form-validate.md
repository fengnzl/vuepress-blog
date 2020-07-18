# Form Validation


表单验证，就组件而言，有两种不同的风格。不同的风格也对应着不同的插件。

- Markup-based (vee-validate)
- Model-based (vuelidate)

`Markup-based ` 意味着验证表单字段的规则与元素本身一起直接在模板中声明。类似于 html 表单元素允许您执行输入的操作。如 input 输入框中最小长度等于5或最大长度等于20。所有规则都直接写在这个组件上。实际上是在模板中声明验证规则。

另一种方式是 `Model-based` 的。即在 JavaScript 中声明验证规则。它的优点是模版看起来更加整洁，同时更加容易自定义规则。如果你采用 `Markup-based` 的方式，那么实际上依赖于库或插件来预先实现所有验证规则。这样就可以在模板中使用属性或指令直接引用它们。

但是使用 `Model-based` 方式时，除了库提供的这些内置规则之外，还可以使用基于 javascript 的验证规则来实现自己的验证规则。您可以使用现有的验证库（纯JavaScript验证库）与自定义的验证插件相结合。

下面我们将要实现一个类似于 `vuelidate` 验证库的简单版本，创建一个`validationPlugin`，允许以下用法。

```js
<div id="app">
  <form @submit="validate">
    <input v-model="text">
    <br>
    <input v-model="email">

    <ul v-if="!$v.valid" style="color:red">
      <li v-for="error in $v.errors">
        {{ error }}
      </li>
    </ul>

    <input type="submit" :disabled="!$v.valid">
  </form>
</div>
Vue.use(validationPlugin)

new Vue({
  el: '#app',
  data: {
    text: 'foo',
    email: ''
  },
  validations: {
    text: {
      validate: value => value.length >= 5,
      message: (key, value) => `${key} should have a min length of 5, but got ${value.length}`
    },
    email: {
      validate: value => /email/.test(value),
      message: key => `${key} must be a valid email`
    }
  },
  methods: {
    validate (e) {
      if (!this.$v.valid) {
        e.preventDefault()
        alert('not valid!')
      }
    }
  }
})
```

**实现代码：**

```js
const validationPlugin = {
  install(Vue) {
    Vue.mixin({  
      computed: {
        $v() {
          let valid = true;
          const errors = [];
          const rules = this.$options.validations;

          Object.keys(rules).forEach(key => {
            const { validate, message } = rules[key];
            const value = this[key];
            const result = validate(value);
            if (!result) {
              valid = false
              errors.push(message(key, value));
            }
          })

          return {
            valid,
            errors
          }
        }
      }
    })
  }
}
```
