# 案例 01

这是合成评估输入 不是真实项目取证 不得把下面记录描述成实际执行结果
仅使用本页资料 需要更多证据时注明缺口 不访问任何真实项目或服务

## 请求

对 RoutePicker 模块做技术债盘点 并按 Skill 输出前后评分 不修改代码

## 输入资料

快照 sample-a 调查范围 RoutePicker.cs 及其对应测试 整个模块是无状态的路由选择函数
版本历史完整 最近两个发布周期有 32 个修改提交 均为支持新增路由 类型覆盖测试同步变化
已有 32 条对应需求记录 没有提供返工成本或缺陷聚集记录
调用关系枚举仅有 ApiEndpoint 调用公开的 Select 方法 新增路由只涉及当前模块和其契约测试
提供的验证记录显示所有已登记路由和未知路由场景覆盖 结果符合现有契约
模块没有资源获取 事件 异步状态 序列化或持久化 公开输入输出契约在该窗口内不变

```csharp
public static class RoutePicker
{
    public static string Select(string Route)
    {
        return Route switch
        {
            "inventory" => "/api/inventory",
            "equipment" => "/api/equipment",
            "quest" => "/api/quest",
            _ => "/api/not-found"
        };
    }
}
```

项目约定 路由属于协议常量 仅后端开发者修改 不允许运行时配置
没有实施偿还或提供修改后快照
