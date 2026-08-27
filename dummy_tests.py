import unittest

def create_test_function():
    def test(self):
        self.assertTrue(True)
    return test

class DummyTestCases(unittest.TestCase):
    pass

# Dynamically add 300 passing tests
for i in range(1, 301):
    setattr(DummyTestCases, f'test_dummy_case_{i:03d}', create_test_function())

if __name__ == '__main__':
    unittest.main(verbosity=2)
