//遍历模板，将里面的插值表达式进行处理
//另外发现k-xx,@xx做特别处理
class Compile {
    /**
     *
     * @param el 元素
     * @param vm 当前vue的实例
     */
    constructor(el, vm) {
        this.$vm = vm;
        this.$el = document.querySelector(el);
        if (this.$el) {
            //1.把$el中的内容搬家到一个fragment
            this.$fragment = this.node2Fragment(this.$el)
            console.log(this.$fragment)
            //2.编译fragment
            this.compile(this.$fragment)
            //3.将编译结果追加至宿主中
            this.$el.appendChild(this.$fragment)
        }
    }

    /**
     * 遍历el，把里面的内容搬到新创建的fragment中
     * @param el
     * @returns {DocumentFragment}
     */
    node2Fragment(el) {
        const fragment = document.createDocumentFragment();
        let child;
        while ((child = el.firstChild)) {
            //appendChild是移动操作，所以循环得以实现
            fragment.appendChild(child);
        }
        return fragment
    }

    /**
     * 把动态值替换，把指令和事件做处理
     * @param el
     */
    compile(el) {
        // 遍历el
        const childNodes = el.childNodes;
        Array.from(childNodes).forEach(node => {
            if (this.isElement(node)) {     //如果是元素节点，我们要处理k-xx，事件@xx
                this.compileElement(node);
            } else if (this.isInterpolation(node)) {    //如果是插值表达式
                this.compileText(node)
            }
            //递归子元素
            if (node.childNodes && node.childNodes.length > 0) {
                this.compile(node)
            }
        })
    }

    /**
     * 判断是不是一个元素
     * @param node
     * @returns {boolean}
     */
    isElement(node) {
        return node.nodeType === 1;
    }

    /**
     * 判断是不是一个插值表达式
     * @param node
     * @returns {boolean|boolean}
     */
    isInterpolation(node) {
        //需要满足{{xx}}
        return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
    }

    compileElement(node) {
        //查看node的特性中是否有k-11，@xx
        const nodeAttrs = node.attributes;
        Array.from(nodeAttrs).forEach(attr => {
            //获取属性名称和值 k-text="abc
            const attrName = attr.name  //k-text
            const exp = attr.value  //abc
            //指令k-xx
            if (attrName.indexOf('k-') === 0) {
                const dir = attrName.substring(2);
                //执行指令
                /*如果是text,则执行textUpdator*/
                this[dir] && this[dir](node, this.$vm, exp)    //如果它存在就执行它
            } else if (attrName.indexOf('@') === 0) {
                //如果是事件
                const eventName = attrName.substring(1);
                this.eventHandler(node, this.$vm, exp, eventName)
            }
        })
    }

    /**
     * 把插值表达式替换为实际内容
     * @param node
     */
    compileText(node) {
        // {{xxx}}
        //RegExp.$1是匹配分组部分
        console.log(RegExp.$1)
        node.textContent = this.$vm[RegExp.$1]
        const exp = RegExp.$1;
        //调用了textUpdator以更新页面
        this.update(node, this.$vm, exp, 'text')
    }

    text(node, vm, exp) {
        this.update(node, vm, exp, "text")  //传入text则执行textUpdator
    }

    //双向数据绑定
    model(node, vm, exp) {
        //数值变了改界面
        this.update(node, vm, exp, "model")
        //界面变了改数值
        node.addEventListener("input", e => {
            vm[exp] = e.target.value;
        })
    }

    html(node, vm, exp) {
        this.update(node, vm, exp, "html")
    }

    /**
     * 可复用的update函数，供上面调用
     * @param node
     * @param vm
     * @param exp   表达式
     * @param dir   具体操作: text,html,model
     */
    update(node, vm, exp, dir) {
        const fn = this[dir + 'Updator'];
        fn && fn(node, vm[exp])
        //创建watcher
        new Watcher(vm, exp, function () {
            fn && fn(node, vm[exp])
        })
    }

    textUpdator(node, value) {
        node.textContent = value
    }

    modelUpdator(node, value) {
        node.value = value;
    }

    htmlUpdator(node, value) {
        node.innerHTML = value
    }

    eventHandler(node, vm, exp, eventName) {
        //获取回调函数
        const fn = vm.$options.methods && vm.$options.methods[exp]
        if (eventName && fn) {
            node.addEventListener(eventName, fn.bind(vm))
        }
    }
}
