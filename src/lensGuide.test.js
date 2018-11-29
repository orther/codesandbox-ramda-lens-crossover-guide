import R from 'ramda';
import deepEqual from 'fast-deep-equal';

// A lens focuses on a specific prop/path within an object and is used to target getting/setting
// values
// the value. The main benefit of using a lens in place of the standard functions Ramda
// provides for interacting with Objects is it allows you to define the focal point
// (think R.prop or R.path) completely decoupled from the operations that will be used.
// The below code should help illustrate what I mean by decoupled from the operation:

const data = { one: 1, nest: { two: 2 } };

// ----------------------
// --- withOUT Lenses ---
// ----------------------

// :: 0) Define Focal Points
const onePath = ['one'];
const twoPath = ['nest', 'two'];

// :: 1) Reading Values
const noLGet1 = R.path(onePath, data); // => 1
const noLGet2 = R.path(twoPath, data); // => 2

// :: 2) Setting Values
const noLSet1 = R.assocPath(onePath, 'Uno', data); // => { one: 'Uno', nest: { two: 2 } }
const noLSet2 = R.assocPath(twoPath, 'Dos', data); // => { one: 1, nest: { two: 'Dos' } }

// :: 3a) Updating Values w/ evolve
const noLUpdate1Evolve = R.evolve({ one: R.negate }, data); // => { one: -1, nest: { two: 2 } }
const noLUpdate2Evolve = R.evolve({ nest: { two: R.negate } }, data); // => { one: 1, nest: { two: -2 } }

// NOTE: R.evolve is simplest way to update object value by applying fn to
//       existing value. R.evolve does have two Obvious disadvantages though;
//       1) can't use the path array and 2) it's less performant because it has
//       to dynamically do nested shallow copies.
//
//       Below is R.converge + R.assocPath + R.path update alternative to evolve
//       that does use path array and doesn't have evolve's performance concerns.
//       The problem with this solution is that it's verbose, repetitive, and
//       convoluted. If you aren't familure with R.converge this isn't intuitive
//       at all. The short explination is that we are building up R.assocPath fn
//       in three steps:
//         -> (1) convergingFn                <= R.assocPath(onePath)
//         -> (2) branchFn #1 (updateFn(val)) <= R.assocPath(onePath)(newValue)
//         -> (3) branchFn #2 (R.identity)    <= R.assocPath(onePath)(newValue)(data)

// :: 3b) Updating Values w/ converge + assocPath + path
export const updateConverge = updateFn => path =>
  R.converge(R.assocPath(path), [
    R.pipe(
      R.path(path),
      updateFn,
    ),
    R.identity, // (=> data)
  ]);
const negatePath = updateConverge(R.negate);

const noLUpdate1Converge = negatePath(onePath)(data); // => { one: -1, nest: { two: 2 } }
const noLUpdate2Converge = negatePath(twoPath)(data); // => { one: 1, nest: { two: -2 } }

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

// -------------------
// === WITH Lenses ===
// -------------------

// 0) Define Focal Points
const oneLens = R.lensPath(['one']);
const twoLens = R.lensPath(['nest', 'two']);

// 1) Reading Values
const yesLGet1 = R.view(oneLens, data); // => 1
const yesLGet2 = R.view(twoLens, data); // => 2

// 2) Setting Values
const yesLSet1 = R.set(oneLens, 'Uno', data); // => { one: 'Uno', nest: { two: 2 } }
const yesLSet2 = R.set(twoLens, 'Dos', data); // => { one: 1, nest: { two: 'Dos' } }

// 3) Updating Values
const yesLUpdate1 = R.over(oneLens, R.negate, data); // => { one: -1, nest: { two: 2 } }
const yesLUpdate2 = R.over(twoLens, R.negate, data); // => { one: 1, nest: { two: -2 } }

// Lens Notes:
//   R.view - Returns the value where lens is focused
//   R.set  - Sets the value where lens is focused to passed in value
//   R.over - Updates the value where lens is focused by applying function to current value

// -------------------------------------------
// === Assert Operations Return Same Values ===
// -------------------------------------------

// :: 1) Reading Values
it('Reads value correctly with and withOUT lenses', () => {
  expect(noLGet1).toBe(yesLGet1);
  expect(noLGet2).toBe(yesLGet2);
});

// :: 2) Setting Values
it('Sets value correctly with and withOUT lenses', () => {
  expect(noLSet1).toBe(noLSet1);
  expect(noLSet2).toBe(noLSet2);
});

// :: 3) Updating Values
it('Updates value correctly with and withOUT lenses', () => {
  expect(noLUpdate1Evolve).toEqual(noLUpdate1Converge);
  expect(noLUpdate1Evolve).toEqual(yesLUpdate1);
});
