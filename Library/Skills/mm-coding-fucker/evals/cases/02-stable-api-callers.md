# 案例 02

这是合成评估输入 不是真实项目取证 不得把下面记录描述成实际执行结果
仅使用本页资料 需要更多证据时注明缺口 不访问任何真实项目或服务

## 请求

盘点 PriceService 与三个价格展示入口的技术债 排列治理档位 不改实现

## 输入资料

快照 sample-b 现有引用枚举只覆盖 ShopLabel CartLabel 和 OrderLabel 更外层调用方尚未检查
PriceService 返回 PriceData 其中 Amount 为 decimal Currency 为 string 接口在最近两个发布周期没有修改
项目需求记录规定三个页面使用完全相同的货币显示规范

ShopLabel.cs 的 Format 方法

```csharp
private string Format(PriceData Data)
{
    return Data.Currency == "CNY" ? $"￥{Data.Amount:F2}" : $"{Data.Currency} {Data.Amount:F2}";
}
```

CartLabel.cs 和 OrderLabel.cs 分别持有同样实现 没有共享格式化入口
提交 c101 为货币代码前置 同时修改三个 Format
提交 c117 为统一小数位数 同时修改三个 Format
两次需求记录都要求逐页检查三个显示结果 PriceService 均未修改
没有当前开发阻塞 没有已知运行故障 近期需求尚未确定
没有提供生命周期 所有存储兼容路径或完整模块测试资料 也没有修改后快照
