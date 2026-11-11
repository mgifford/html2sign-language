# P3/P4 research contracts

Status: **P4.1 plan-contract validator implemented; no model run and no P3/P4 result.**

`plan_contract.py` validates a constrained model plan against a P1 fixture:

```sh
python3 tools/p3/plan_contract.py --p1 /tmp/NEG-01-p1.json --plan /tmp/NEG-01-plan.json
```

Rejections include:

- unknown top-level/sentence/token keys;
- an unknown block ID;
- a source span outside the P1 block;
- a token whose `word` does not match the source span;
- empty glosses;
- missing/empty sentences;
- a fixture-ID mismatch.

This is the P4 direct/hybrid invariant checker, not a model, prompt, planner, or ASL component. A valid plan is still a lexical plan, not ASL.

Tests:

```sh
python3 -m unittest discover -s tools/p3/tests -p 'test_*.py'
```

See [P3-P4-RESEARCH.md](../../experiments/html-to-asl/docs/P3-P4-RESEARCH.md).
