class KVue {
    constructor(options) {
        this.$options = options
        this.$data = options.data
        //响应化
        this.observe(this.$data)

        //测试代码
        // new Watcher(this, 'test');
        // this.test;
        //创建编译器
        new Compile(options.el, this);

        if (options.created()) {
            options.created.call(this)
        }
    }

    //递归遍历，使传递进来的对象响应化
    observe(value) {
        if (!value || typeof value !== 'object') {
            return
        }
        Object.keys(value).forEach(key => { /*遍历value的keys*/
            //对key做响应式处理
            this.defineReactive(value, key, value[key])
            this.proxyData(key)
        })
    }

    defineReactive(obj, key, val) {
        //创建Dep实例：Dep和key是一对一对应
        const dep = new Dep()

        //递归
        this.observe(val)

        //给obj定义属性
        Object.defineProperty(obj, key, {
            //用get、set做拦截器
            get() {
                //将Dep.target指向Watcher实例的Dep中
                Dep.target && dep.addDep(Dep.target)
                return val
            },
            set(newVal) {
                if (newVal !== val) {
                    val = newVal
                    dep.notify()
                }
            }
        })
    }

    //在vue根上定义属性代理data中的数据
    //定义了之后可以直接用`.`访问属性，不用`$data.`
    proxyData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key]
            },
            set(newVal) {
                this.$data[key] = newVal
            }
        })
    }
}


//Dep:管理若干watcher实例，它和key一对一关系
class Dep {
    constructor() {
        this.deps = []
    }

    addDep(watcher) {
        this.deps.push(watcher)
    }

    //notify：所有的dep执行一遍update
    notify() {
        this.deps.forEach(dep => dep.update())
    }
}

//保存ui中依赖，实现update函数可以更新它
class Watcher {
    /**
     *
     * @param vm
     * @param key
     * @param cb    回调函数
     */
    constructor(vm, key, cb) {
        this.vm = vm;
        this.key = key;
        this.cb = cb;

        //将当前实例指向Dep.target
        Dep.target = this;
        this.vm[this.key];//读一次key触发getter
        Dep.target = null
    }

    update() {
        this.cb.call(this.vm, this.vm[this.key])
        //如果这里不是console.log而是实现dom操作，就可以实现更新了
        //console.log(`${this.key}属性更新了`)
    }
}
















