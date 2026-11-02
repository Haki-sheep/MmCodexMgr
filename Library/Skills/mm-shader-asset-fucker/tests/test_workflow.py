import argparse
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import saf


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.project = self.root / '游戏'
        (self.project / 'Assets/角色').mkdir(parents=True)
        (self.project / 'ProjectSettings').mkdir()
        (self.project / 'ProjectSettings/ProjectVersion.txt').write_text('m_EditorVersion: 6000.3.26f1', encoding='utf-8')
        self.original = self.project / 'Assets/角色/原.asset'
        self.original.write_bytes(b'opaque compiled fixture')
        self.restored = self.root / '已还原.shader'
        self.restored.write_text('Shader "Fixture/Shader" { SubShader {} }\n', encoding='utf-8')
        self.export_report = self.root / 'export-report.json'
        self.export_data = {'shaders': [{'source': str(self.original), 'output': str(self.restored), 'shader': 'Fixture/Shader', 'status': 'exported'}]}
        self.export_manifest = self.root / 'export-manifest.json'
        self.compilation_report = self.root / 'compilation.json'
        self.compilation_data = {'status': 'passed', 'files': [{'path': str(self.restored), 'status': 'passed'}]}
        self.validation_manifest = self.root / 'validation.manifest.json'
        self.refresh_evidence()

    def refresh_evidence(self):
        saf.write_json(self.export_report, self.export_data)
        saf.write_json(self.compilation_report, self.compilation_data)
        saf.write_json(self.export_manifest, {'kind': 'ShaderAssetFucker.export', 'status': 'completed', 'exitCode': 0,
                       'report': str(self.export_report), 'reportSha256': saf.digest(self.export_report),
                       'inputs': saf.fingerprints([self.original]), 'outputs': saf.fingerprints([self.restored])})
        saf.write_json(self.validation_manifest, {'kind': 'ShaderAssetFucker.validation', 'status': 'passed',
                       'report': str(self.compilation_report), 'reportSha256': saf.digest(self.compilation_report), 'sources': saf.fingerprints([self.restored])})

    def rows(self):
        return saf.replacement_rows(self.project, [self.export_manifest], self.validation_manifest)

    def args(self, **values):
        data = dict(project=self.project, task=self.project / 'Temp/FakeUnityCLI/task', phase='plan', backup=self.root / 'backup',
                    export_manifest=[self.export_manifest], validation_manifest=self.validation_manifest, index=None, allow_replace=False, compile_only=False)
        data.update(values)
        return argparse.Namespace(**data)

    def test_unicode_assets_map_to_sibling_shader_with_both_hashes(self):
        rows = self.rows()
        self.assertEqual(rows[0][:2], ['Assets/角色/原.asset', 'Assets/角色/原.shader'])
        self.assertEqual(rows[0][3:5], [saf.digest(self.original), saf.digest(self.restored)])

    def test_modified_original_stops_replacement(self):
        self.original.write_bytes(b'user edit after export')
        with self.assertRaisesRegex(ValueError, 'File changed'):
            self.rows()

    def test_modified_restored_source_stops_replacement(self):
        self.restored.write_text('changed after compilation', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'File changed'):
            self.rows()

    def test_partial_export_is_not_accepted(self):
        data = saf.read_json(self.export_manifest)
        data.update(status='failed', exitCode=1)
        saf.write_json(self.export_manifest, data)
        with self.assertRaisesRegex(ValueError, 'Partial or failed'):
            self.rows()

    def test_tampered_compiler_report_is_not_accepted(self):
        self.compilation_report.write_text('{}', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Compiler report changed'):
            self.rows()

    def test_compilation_coverage_must_match_manifest(self):
        self.compilation_data['files'] = []
        self.refresh_evidence()
        with self.assertRaisesRegex(ValueError, 'does not cover'):
            self.rows()

    def test_duplicate_shader_objects_cannot_replace_one_file(self):
        self.export_data['shaders'].append(self.export_data['shaders'][0].copy())
        self.refresh_evidence()
        with self.assertRaisesRegex(ValueError, 'duplicate Shader'):
            self.rows()

    def test_bundle_source_does_not_map_to_project_asset(self):
        self.original = self.root / 'external.bundle'
        self.original.write_bytes(b'container')
        self.export_data['shaders'][0]['source'] = str(self.original)
        self.refresh_evidence()
        with self.assertRaisesRegex(ValueError, 'Only original project'):
            self.rows()

    def test_missing_glob_is_not_empty_success(self):
        with self.assertRaises(FileNotFoundError):
            saf.expand_inputs([str(self.root / '*.missing')])

    def test_plan_preparation_only_writes_temp_files(self):
        before = saf.digest(self.original)
        args = self.args()
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(saf.prepare(args), 0)
        self.assertEqual(before, saf.digest(self.original))
        self.assertFalse(args.backup.exists())
        self.assertTrue((args.task / 'plan.cs.txt').is_file())

    def test_task_outside_editor_temp_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Temp/FakeUnityCLI'):
            saf.prepare(self.args(task=self.project / 'Assets/job'))

    def test_backup_inside_assets_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Backup must'):
            saf.prepare(self.args(backup=self.project / 'Assets/backup'))

    def test_apply_requires_authorized_intent_and_completed_backup(self):
        args = self.args()
        with contextlib.redirect_stdout(io.StringIO()):
            saf.prepare(args)
        with self.assertRaisesRegex(ValueError, 'allow-replace'):
            saf.prepare(self.args(phase='apply', index=0))
        with self.assertRaisesRegex(ValueError, 'have not finished'):
            saf.prepare(self.args(phase='apply', index=0, allow_replace=True))

    def test_runtime_tampering_is_detected(self):
        package = self.root / 'package'
        package.mkdir()
        (package / 'runtime').mkdir()
        executable = package / 'tool.exe'
        executable.write_bytes(b'original')
        saf.write_json(package / 'runtime/manifest.json', {'executable': 'tool.exe', 'files': {'tool.exe': saf.digest(executable)}})
        executable.write_bytes(b'tampered')
        with mock.patch.object(saf, 'ROOT', package), mock.patch.object(saf.sys, 'platform', 'win32'), mock.patch.object(saf.platform, 'machine', return_value='AMD64'):
            with self.assertRaisesRegex(ValueError, 'fingerprint mismatch'):
                saf.package_check()


if __name__ == '__main__':
    unittest.main()
