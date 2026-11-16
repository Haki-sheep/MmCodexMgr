using System;
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;

namespace MmPerformance
{
    #region 采样与证据

    [Serializable]
    public sealed class EnvironmentInfo
    {
        /// <summary> 采样端 Unity 版本 </summary>
        public string unityVersion;
        /// <summary> 实际运行平台 </summary>
        public string platform;
        /// <summary> 启动时活动场景路径 </summary>
        public string scenePath;
        /// <summary> 构建目标 不在读取报告时重算 </summary>
        public string buildTarget;
        /// <summary> 采样设备型号 </summary>
        public string deviceModel;
        /// <summary> 采样图形设备 </summary>
        public string graphicsDevice;
        /// <summary> 采样处理器型号 </summary>
        public string processor;
        /// <summary> 观测画面宽度 像素 </summary>
        public int screenWidth;
        /// <summary> 观测画面高度 像素 </summary>
        public int screenHeight;
        /// <summary> 应用帧率限制 </summary>
        public int targetFrameRate;
        /// <summary> 垂直同步间隔 </summary>
        public int vSyncCount;
        /// <summary> 启动质量档位索引 </summary>
        public int qualityLevel;
        /// <summary> 启动质量档位名称 </summary>
        public string qualityName;
        /// <summary> 当前渲染管线类型 </summary>
        public string renderPipeline;
        /// <summary> 实际颜色空间 </summary>
        public string colorSpace;
        /// <summary> 固定更新步长 秒 </summary>
        public float fixedDeltaTime;

        public static EnvironmentInfo Capture()
        {
            int Quality = QualitySettings.GetQualityLevel();
            var Pipeline = GraphicsSettings.currentRenderPipeline;
            var Scene = SceneManager.GetActiveScene();
            return new EnvironmentInfo
            {
                unityVersion = Application.unityVersion, platform = Application.platform.ToString(),
                scenePath = string.IsNullOrEmpty(Scene.path) ? Scene.name : Scene.path,
                buildTarget = Application.platform.ToString(), deviceModel = SystemInfo.deviceModel,
                graphicsDevice = SystemInfo.graphicsDeviceName, processor = SystemInfo.processorType,
                screenWidth = Screen.width, screenHeight = Screen.height, targetFrameRate = Application.targetFrameRate,
                vSyncCount = QualitySettings.vSyncCount, qualityLevel = Quality, qualityName = QualitySettings.names[Quality],
                renderPipeline = Pipeline == null ? "Built-in" : Pipeline.GetType().FullName,
                colorSpace = QualitySettings.activeColorSpace.ToString(), fixedDeltaTime = Time.fixedDeltaTime
            };
        }
    }

    [Serializable]
    public sealed class CaptureOverhead
    {
        /// <summary> 计数器读取与样本追加测量次数 </summary>
        public int callback_count;
        /// <summary> 测量段累计耗时 微秒 </summary>
        public double callback_total_us;
        /// <summary> 测量段最大耗时 微秒 </summary>
        public double callback_max_us;
        /// <summary> 采样中周期收据写入次数 </summary>
        public int receipt_writes;
        /// <summary> 周期收据累计写入耗时 毫秒 </summary>
        public double receipt_total_ms;
        /// <summary> 首次完整报告写入耗时 毫秒 </summary>
        public double final_write_ms;
    }

    [Serializable]
    public sealed class CameraSnapshot
    {
        /// <summary> 相机层级路径 用于跨运行识别 </summary>
        public string path;
        /// <summary> 相机世界坐标 </summary>
        public Vector3 position;
        /// <summary> 相机世界旋转 </summary>
        public Quaternion rotation;
        /// <summary> 相机垂直视场角 度 </summary>
        public float fov;
        /// <summary> 相机是否采用正交投影 </summary>
        public bool orthographic;
        /// <summary> 相机正交半高 世界单位 </summary>
        public float orthographic_size;
        /// <summary> 相机可见图层掩码 </summary>
        public int culling_mask;
        /// <summary> 相机实际渲染宽度 像素 </summary>
        public int width;
        /// <summary> 相机实际渲染高度 像素 </summary>
        public int height;
        /// <summary> 可用相机扩展设置 JSON </summary>
        public string settings_json;
    }

    [Serializable]
    public sealed class ContextSnapshot
    {
        /// <summary> 快照阶段 start 或 end </summary>
        public string stage;
        /// <summary> Unity 帧编号 或原始 Profiler 帧索引 由所属结构定义 </summary>
        public int frame;
        /// <summary> 项目健康状态是否经过检查 </summary>
        public bool health_verified;
        /// <summary> 项目健康检查结果 </summary>
        public bool healthy;
        /// <summary> 画面验证状态 valid invalid 或 unverified </summary>
        public string visual_status = "unverified";
        /// <summary> 健康或画面检查证据位置与依据 </summary>
        public string evidence = "";
        /// <summary> 项目工作负载与业务条件 JSON </summary>
        public string project_json = "";
        /// <summary> 可读取的管线公开设置 JSON </summary>
        public string pipeline_json = "";
        /// <summary> 快照时活动相机的稳定排序记录 </summary>
        public List<CameraSnapshot> camerasList = new List<CameraSnapshot>();
    }

    public interface IPerformanceContext
    {
        /// <summary>
        /// 查询项目健康与画面证据 返回可跨运行比较的业务条件 不修改场景
        /// </summary>
        ContextSnapshot Capture();
    }

    public static class SceneContext
    {
        public static ContextSnapshot Capture(string contextType, string stage)
        {
            var Result = new ContextSnapshot();
            if (!string.IsNullOrEmpty(contextType))
            {
                var Type = System.Type.GetType(contextType, true);
                if (!typeof(IPerformanceContext).IsAssignableFrom(Type))
                    throw new ArgumentException("现场钩子必须实现 IPerformanceContext " + contextType);
                Result = ((IPerformanceContext)Activator.CreateInstance(Type)).Capture();
                if (Result == null) throw new InvalidOperationException("现场钩子返回 null " + contextType);
                if (Result.visual_status != "valid" && Result.visual_status != "invalid" && Result.visual_status != "unverified")
                    throw new ArgumentException("visual_status 必须为 valid invalid 或 unverified");
            }
            Result.stage = stage;
            Result.frame = Time.frameCount;
            Result.camerasList.Clear();
            foreach (var Camera in UnityEngine.Camera.allCameras)
            {
                string Path = Camera.name;
                for (var Parent = Camera.transform.parent; Parent != null; Parent = Parent.parent) Path = Parent.name + "/" + Path;
                Result.camerasList.Add(new CameraSnapshot
                {
                    path = Path, position = Camera.transform.position, rotation = Camera.transform.rotation,
                    fov = Camera.fieldOfView, orthographic = Camera.orthographic, orthographic_size = Camera.orthographicSize,
                    culling_mask = Camera.cullingMask, width = Camera.pixelWidth, height = Camera.pixelHeight,
                    settings_json = ReadSettings(Camera.GetComponents<Component>(), new[] { "renderPostProcessing", "antialiasing", "antialiasingQuality", "renderShadows", "allowXRRendering" })
                });
            }
            Result.camerasList.Sort((Left, Right) => string.CompareOrdinal(Left.path, Right.path));
            Result.pipeline_json = ReadSettings(new UnityEngine.Object[] { GraphicsSettings.currentRenderPipeline },
                new[] { "renderScale", "upscalingFilter", "fsrOverrideSharpness", "fsrSharpness", "msaaSampleCount", "supportsHDR", "shadowDistance" });
            return Result;
        }

        private static string ReadSettings(UnityEngine.Object[] objectsList, string[] namesList)
        {
            var Result = new SettingCollection();
            foreach (var Object in objectsList)
            {
                if (Object == null) continue;
                var Type = Object.GetType();
                foreach (string Name in namesList)
                {
                    var Property = Type.GetProperty(Name, BindingFlags.Public | BindingFlags.Instance);
                    if (Property == null || !Property.CanRead || Property.GetIndexParameters().Length != 0) continue;
                    var Value = Property.GetValue(Object);
                    Result.valuesList.Add(new Setting { name = Type.FullName + "." + Name,
                        value = Convert.ToString(Value, System.Globalization.CultureInfo.InvariantCulture) });
                }
            }
            return JsonUtility.ToJson(Result);
        }

        [Serializable]
        private sealed class SettingCollection
        {
            /// <summary> 实际可读取的公开设置 </summary>
            public List<Setting> valuesList = new List<Setting>();
        }

        [Serializable]
        private sealed class Setting
        {
            /// <summary> 公开属性或原生 Marker 名称 </summary>
            public string name;
            /// <summary> 公开属性的稳定字符串表示 </summary>
            public string value;
        }
    }
    #endregion

}
