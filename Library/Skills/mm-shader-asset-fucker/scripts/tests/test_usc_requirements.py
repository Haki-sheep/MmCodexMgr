import os
from pathlib import Path
import struct
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import usc_compile as usc
import usc_validate as validator


class MessageReader:
    def __init__(self, messages):
        self.messages = iter(messages)

    def read(self, label):
        return next(self.messages)


class RecordingSocket:
    def __init__(self):
        self.sent = []

    def sendall(self, value):
        self.sent.append(value)


class RequirementProtocolTests(unittest.TestCase):
    def test_preprocessor_requirement_table_preserves_64_bit_values(self):
        client = usc.Client(None)
        client.r = MessageReader([
            ('header', 0), ('header', 0), ('header', 0), ('header', 227), ('int', 2),
            ('payload', b'INSTANCING_ON'), ('header', 2048),
            ('payload', b'RAY_QUERY'), ('header', 1 << 35)])
        base, keywords = client.snippet_requirements()
        snippet = {'requirements': base, 'keyword_requirements': keywords}
        self.assertEqual(usc.requirements_for(snippet, []), 227)
        self.assertEqual(usc.requirements_for(snippet, ['INSTANCING_ON']), 227 | 2048)
        self.assertEqual(usc.requirements_for(snippet, ['RAY_QUERY']), 227 | (1 << 35))
        self.assertEqual(usc.requirements_for(snippet, ['UNRELATED']), 227)

    def test_missing_or_malformed_requirement_table_is_not_zero(self):
        client = usc.Client(None)
        client.r = MessageReader([('header', 0)] * 3 + [('payload', b'unknown-protocol')])
        with self.assertRaisesRegex(ValueError, 'snip.requirements'):
            client.snippet_requirements()
        with self.assertRaises(KeyError):
            usc.requirements_for({}, [])

    def test_compile_request_sends_requirements_as_uint64_not_string(self):
        connection = RecordingSocket()
        client = usc.Client(connection)
        client.r = MessageReader([('payload', b'shader: 0')])
        requirements = 4075 | (1 << 35)
        client.compile_snippet('source', 'includes', 0, ['INSTANCING_ON'], 4, requirements)
        self.assertEqual(connection.sent[-3], usc.MAGIC + struct.pack('<Q', requirements))
        self.assertEqual(len(connection.sent[-3]), 12)


TARGET_SHADER = '''Shader "Probe/Requirements" {
SubShader {
Pass {
CGPROGRAM
#pragma vertex vert
#pragma fragment frag
#pragma target 4.0
#pragma multi_compile __ INSTANCING_ON
// ---- variant 0 (base) ----
// ---- variant 1: INSTANCING_ON ----
#include "UnityCG.cginc"
#if SHADER_TARGET < 35
#error SHADER_TARGET_REQUIREMENTS_MISSING
#endif
#if defined(INSTANCING_ON) && !defined(UNITY_INSTANCING_ENABLED)
#error INSTANCING_REQUIREMENTS_MISSING
#endif
struct appdata { float4 vertex : POSITION; UNITY_VERTEX_INPUT_INSTANCE_ID };
float4 vert(appdata v) : SV_POSITION { UNITY_SETUP_INSTANCE_ID(v); return UnityObjectToClipPos(v.vertex); }
float4 frag() : SV_Target { return 1; }
ENDCG
}
}
}'''


@unittest.skipUnless(os.environ.get('UNITY_SHADER_COMPILER_DATA'), 'Set UNITY_SHADER_COMPILER_DATA to run the exact installed compiler')
class LiveRequirementTests(unittest.TestCase):
    def test_target_and_instancing_requirements_roundtrip(self):
        data = Path(os.environ['UNITY_SHADER_COMPILER_DATA'])
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shader = root / 'target.shader'
            shader.write_text(TARGET_SHADER, encoding='utf-8')
            result = validator.validate_file(shader, data, 4, root, 30, None)
            self.assertEqual(result['status'], 'passed', result)
            self.assertEqual(validator.summarize([result])['stage_passed'], 4)
            program = result['programs'][0]
            self.assertTrue(program['requirements'] & 2048)
            self.assertEqual(program['requirement_source'], 'UnityShaderCompiler.preprocess')
            with validator.CompilerSession(data, root / 'negative-control.log', 30) as session:
                snippets, _, ok, _ = session.begin().preprocess(TARGET_SHADER, str(data / 'Resources/CGIncludes'), 4)
                self.assertTrue(ok)
                client = session.begin()
                success, _, errors, _ = client.compile_snippet(snippets[0]['text'], str(data / 'Resources/CGIncludes'), 0, ['INSTANCING_ON'], 4, 0)
                self.assertFalse(success)
                self.assertIn('SHADER_TARGET_REQUIREMENTS_MISSING', errors)

    def test_conditional_target_and_require_are_per_variant_and_per_pass(self):
        data = Path(os.environ['UNITY_SHADER_COMPILER_DATA'])
        body = '''
HLSLPROGRAM
#pragma vertex vert
#pragma fragment frag
#pragma target 2.0
#pragma target 4.0 HIGH
#pragma require msaatex : MSAA
#if defined(HIGH)
#if SHADER_TARGET < 35
#error HIGH_TARGET_REQUIREMENTS_MISSING
#endif
#else
#if SHADER_TARGET != 20
#error BASE_TARGET_WAS_RAISED
#endif
#endif
float4 vert(float4 v:POSITION):SV_POSITION { return v; }
float4 frag():SV_Target { return 1; }
ENDHLSL
'''
        source = 'Shader "Probe/Conditional" {\nSubShader {\nPass {\n' + body + '}\nPass {\n' + body.replace('target 2.0', 'target 3.0').replace('SHADER_TARGET != 20', 'SHADER_TARGET != 30') + '}\n}\n}'
        with tempfile.TemporaryDirectory() as directory:
            with validator.CompilerSession(data, Path(directory) / 'conditional.log', 30) as session:
                snippets, _, ok, _ = session.begin().preprocess(source, str(data / 'Resources/CGIncludes'), 4)
                self.assertTrue(ok)
                self.assertEqual(len(snippets), 2)
                self.assertNotEqual(snippets[0]['requirements'], snippets[1]['requirements'])
                for snippet in snippets:
                    self.assertEqual(usc.requirements_for(snippet, ['MSAA']), snippet['requirements'] | (1 << 20))
                    for keywords in ([], ['HIGH']):
                        requirements = usc.requirements_for(snippet, keywords)
                        for function in (0, 1):
                            success, blob, errors, _ = session.begin().compile_snippet(snippet['text'], str(data / 'Resources/CGIncludes'), function, keywords, 4, requirements)
                            self.assertTrue(success, (keywords, requirements, errors))
                            self.assertTrue(validator.valid_dxbc(blob, 'vertex' if function == 0 else 'fragment')[0])


if __name__ == '__main__':
    unittest.main()
