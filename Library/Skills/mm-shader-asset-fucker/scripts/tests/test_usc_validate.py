import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import usc_validate as validator


def program(markers='', pragmas=''):
    return 'HLSLPROGRAM\n#pragma vertex vert\n#pragma fragment frag\n' + pragmas + '\n' + markers + '\nENDHLSL'


class VariantCoverageTests(unittest.TestCase):
    def test_each_pass_uses_only_its_recorded_combinations(self):
        source = 'Pass { Name "Forward"\n' + program('// ---- variant 0: MODE_A + GLOW ----\n// ---- variant 1: MODE_B ----') + '}\n'
        source += 'Pass { Name "Shadow"\n' + program('// ---- variant 0 (base) ----\n// ---- variant 1: INSTANCING_ON ----') + '}'
        plans = validator.program_plans(source)
        self.assertEqual([(plan['pass'], plan['variants']) for plan in plans], [
            ('Forward', [('GLOW', 'MODE_A'), ('MODE_B',)]), ('Shadow', [(), ('INSTANCING_ON',)])])

    def test_repeated_keyword_sets_are_compiled_once(self):
        plan = validator.program_plans(program('// ---- variant 0: B + A ----\n// ---- variant 1: A + B ----'))[0]
        self.assertEqual(plan['variants'], [('A', 'B')])

    def test_unmarked_variant_pragmas_do_not_claim_base_is_full_coverage(self):
        plan = validator.program_plans(program(pragmas='#pragma multi_compile __ FIRST SECOND'))[0]
        self.assertEqual(plan['variants'], [])
        self.assertEqual(plan['variant_source'], 'unavailable')

    def test_explicit_sets_enable_unmarked_inputs_without_cartesian_expansion(self):
        plan = validator.program_plans(program(pragmas='#pragma multi_compile __ FIRST SECOND'), [(), ('SECOND',)])[0]
        self.assertEqual(plan['variants'], [(), ('SECOND',)])
        self.assertEqual(plan['variant_source'], 'explicit_keywords')

    def test_unsupported_stages_are_disclosed(self):
        plan = validator.program_plans(program(pragmas='#pragma geometry geom'))[0]
        self.assertEqual(plan['unsupported_stages'], ['geometry'])

    def test_no_program_is_not_a_successful_empty_validation(self):
        self.assertEqual(validator.program_plans('Shader "OnlyRef" { SubShader { UsePass "Other/Forward" } }'), [])


class CompilerOutputTests(unittest.TestCase):
    def dxbc(self, stage):
        instructions = struct.pack('<III', (stage << 16) | 0x50, 3, 0x0100003e)
        chunk = b'SHDR' + struct.pack('<I', len(instructions)) + instructions
        return b'DXBC' + b'\0' * 16 + struct.pack('<IIII', 1, 36 + len(chunk), 1, 36) + chunk

    def test_empty_program_never_passes_even_if_compiler_reported_success(self):
        self.assertFalse(validator.valid_output(b'', 'vertex', 4)[0])

    def test_dxbc_container_and_requested_stage_are_validated(self):
        vertex = self.dxbc(1)
        self.assertTrue(validator.valid_dxbc(vertex, 'vertex')[0])
        self.assertFalse(validator.valid_dxbc(vertex, 'fragment')[0])
        self.assertFalse(validator.valid_dxbc(vertex[:-1], 'vertex')[0])

    def test_malformed_instruction_stream_is_rejected(self):
        vertex = bytearray(self.dxbc(1))
        struct.pack_into('<I', vertex, 48, 400)
        self.assertFalse(validator.valid_dxbc(bytes(vertex), 'vertex')[0])

    def test_comments_are_not_both_glsl_stages(self):
        self.assertFalse(validator.valid_output(b'// VERTEX FRAGMENT void main void main', 'vertex+fragment', 9)[0])
        glsl = b'#ifdef VERTEX\nvoid main() {}\n#endif\n#ifdef FRAGMENT\nvoid main() {}\n#endif'
        self.assertTrue(validator.valid_output(glsl, 'vertex+fragment', 9)[0])

    def test_preprocessor_information_is_not_an_error(self):
        messages = [validator.diagnostic({'lvl': level, 'plat': 4, 'line': 0, 'msg': 'message'})['severity'] for level in range(3)]
        self.assertEqual(messages, ['info', 'warning', 'error'])

    def test_missing_exact_compiler_emits_a_failed_report(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            report = root / 'report.json'
            result = validator.main(['-u', str(root / 'missing-editor'), '--report', str(report), str(root)])
            self.assertEqual(result, 2)
            content = json.loads(report.read_text(encoding='utf-8'))
            self.assertEqual(content['status'], 'failed')
            self.assertIn('unavailable', content['error'])


if __name__ == '__main__':
    unittest.main()
