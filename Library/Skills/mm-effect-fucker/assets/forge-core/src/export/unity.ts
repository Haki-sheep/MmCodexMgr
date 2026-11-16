// Unity export: a grid sprite sheet plus a small runtime player. The player
// slices the sheet itself with Sprite.Create, so there is no editor import
// step and it works on any Unity version from 2019 on, with SpriteRenderer
// or a UI Image.

export const UNITY_PLAYER_CS = `// FxSheetPlayer.cs - plays a grid sprite sheet exported by FX Forge.
// Put it on a GameObject with a SpriteRenderer (world) or an Image (UI).
using UnityEngine;
using UnityEngine.UI;

[DisallowMultipleComponent]
public class FxSheetPlayer : MonoBehaviour
{
    [Header("Sheet (values come from the .fxsheet.json)")]
    public Texture2D sheet;
    public int columns = 1;
    public int rows = 1;
    public int frameCount = 1;
    public float fps = 30f;

    [Header("Playback")]
    public bool loop = true;
    public bool playOnEnable = true;
    public bool destroyWhenDone = false;
    [Tooltip("Random start frame, so many looping copies do not move in sync.")]
    public bool randomStartFrame = false;
    public float speed = 1f;
    public float pixelsPerUnit = 100f;

    Sprite[] _sprites;
    SpriteRenderer _sr;
    Image _img;
    float _time;
    bool _playing;

    public bool IsPlaying => _playing;

    void Awake()
    {
        _sr = GetComponent<SpriteRenderer>();
        _img = GetComponent<Image>();
        BuildSprites();
    }

    void OnEnable()
    {
        if (playOnEnable) Play();
    }

    public void BuildSprites()
    {
        if (sheet == null || columns < 1 || rows < 1) return;
        int fw = sheet.width / columns;
        int fh = sheet.height / rows;
        int n = Mathf.Clamp(frameCount, 1, columns * rows);
        _sprites = new Sprite[n];
        for (int i = 0; i < n; i++)
        {
            int col = i % columns;
            int row = i / columns;
            // sheet rows go top to bottom, texture coordinates go bottom to top
            var rect = new Rect(col * fw, sheet.height - (row + 1) * fh, fw, fh);
            _sprites[i] = Sprite.Create(sheet, rect, new Vector2(0.5f, 0.5f), pixelsPerUnit, 0, SpriteMeshType.FullRect);
            _sprites[i].name = sheet.name + "_" + i;
        }
        Show(0);
    }

    public void Play()
    {
        if (_sprites == null) BuildSprites();
        if (_sprites == null) return;
        _time = randomStartFrame ? Random.Range(0, _sprites.Length) / Mathf.Max(1f, fps) : 0f;
        _playing = true;
        SetVisible(true);
        Show(Frame());
    }

    public void Stop()
    {
        _playing = false;
        SetVisible(false);
    }

    void Update()
    {
        if (!_playing || _sprites == null) return;
        _time += Time.deltaTime * speed;
        int f = Mathf.FloorToInt(_time * fps);
        if (f >= _sprites.Length)
        {
            if (loop)
            {
                f %= _sprites.Length;
            }
            else
            {
                _playing = false;
                if (destroyWhenDone) { Destroy(gameObject); return; }
                SetVisible(false);
                return;
            }
        }
        Show(f);
    }

    int Frame() => Mathf.Clamp(Mathf.FloorToInt(_time * fps) % Mathf.Max(1, _sprites.Length), 0, _sprites.Length - 1);

    void Show(int i)
    {
        if (_sprites == null || _sprites.Length == 0) return;
        var s = _sprites[Mathf.Clamp(i, 0, _sprites.Length - 1)];
        if (_sr != null) _sr.sprite = s;
        if (_img != null) _img.sprite = s;
    }

    void SetVisible(bool v)
    {
        if (_sr != null) _sr.enabled = v;
        if (_img != null) _img.enabled = v;
    }

    void OnDestroy()
    {
        if (_sprites == null) return;
        foreach (var s in _sprites) if (s != null) Destroy(s);
    }
}
`;

export function unityReadme(m: {
  name: string;
  image: string;
  columns: number;
  rows: number;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  loop: boolean;
  pixelArt: boolean;
  additive: boolean;
}): string {
  return `FX Forge - Unity export: ${m.name}
=========================================

Files
  ${m.image}            sprite sheet, ${m.columns} x ${m.rows} grid, ${m.frameCount} frames of ${m.frameWidth} x ${m.frameHeight} px, no padding
  ${m.name}.fxsheet.json   the same numbers in JSON
  FxSheetPlayer.cs      runtime player (no editor setup needed)

Setup
  1. Copy this folder into your project's Assets folder.
  2. Select ${m.image} and set in the Inspector:
       Texture Type      Sprite (2D and UI) or Default
       Max Size          at least the sheet size
       Compression       None
       Filter Mode       ${m.pixelArt ? 'Point (no filter)   <- pixel art' : 'Bilinear'}
       Generate Mip Maps off
     Press Apply.
  3. Create a GameObject with a SpriteRenderer (or a UI Image) and add FxSheetPlayer.
  4. Drag ${m.image} into "Sheet" and enter:
       Columns ${m.columns}   Rows ${m.rows}   Frame Count ${m.frameCount}   Fps ${m.fps}   Loop ${m.loop ? 'on' : 'off'}
  5. Press Play.

Tips
  - One-shot effects (hits, explosions): Loop off, Destroy When Done on, and
    Instantiate the prefab where the hit happens.
  - Many looping copies (torches, fires): turn on Random Start Frame.
${m.additive ? `  - This effect glows (additive layers). It was exported on a transparent
    background and looks right with the default sprite material. For a brighter
    glow on dark scenes, use an additive material (URP: Sprite-Unlit with Blend
    set to Additive; Built-in: Particles/Additive).
` : ''}  - Prefer slicing in the Sprite Editor? Use Slice > Grid By Cell Count with
    ${m.columns} columns and ${m.rows} rows, then make an Animation Clip with
    Samples = ${m.fps}.
`;
}
