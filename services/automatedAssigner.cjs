const PickupRequest = require('../models/Pickup.cjs');
const mongoose = require('mongoose');
// You might also need the User model if you plan to use it directly for other things,
// but for aggregation, Mongoose uses the 'ref' in the schema to find the collection name.


/**
 * Helper function to add $lookup and $unwind stages for the main 'user' field of the PickupRequest.
 * This populates the 'user' field with 'name' and 'profileImage'.
 * @returns {Array} An array of aggregation stages
 */
const lookupMainUserStages = [
  {
    $lookup: {
      from: 'users', // The name of the collection for the 'User' model (usually lowercase and plural of the model name)
      localField: 'user', // Field from the input documents (PickupRequest)
      foreignField: '_id', // Field from the "joined" collection (User)
      as: 'userDetails' // Output array field name
    }
  },
  {
    $unwind: {
      path: '$userDetails',
      preserveNullAndEmptyArrays: true // Keep the pickup even if the user is not found (e.g., deleted user)
    }
  },
  {
    $addFields: {
      // Add user's name and profileImage directly to the 'user' object within the pickup request
      // Make sure 'name' and 'profileImage' match your User model's field names
      'user.name': '$userDetails.name',
      'user.profileImage': '$userDetails.profileImage'
    }
  },
  {
    $project: {
      userDetails: 0 // Remove the temporary userDetails field
    }
  }
];

/**
 * Helper function to add aggregation stages to populate the 'sender' field
 * within each object in the 'notes' array.
 * It will add 'name' and 'profileImage' from the User model to the sender object.
 * @returns {Array} An array of aggregation stages
 */
const populateNotesSenderStages = [
  // Stage 1: Unwind the 'notes' array. This creates a separate document for each note,
  // allowing us to perform lookups on individual note fields.
  {
    $unwind: {
      path: '$notes',
      preserveNullAndEmptyArrays: true // Crucial: Keeps the pickup request even if it has no notes
    }
  },
  // Stage 2: Lookup the sender details for the current note's sender ID
  {
    $lookup: {
      from: 'users', // The collection name for your User model
      localField: 'notes.sender', // The sender ID field within the unwound note document
      foreignField: '_id', // The _id field in the users collection
      as: 'senderInfo' // Temporary array to hold the sender's user details
    }
  },
  // Stage 3: Unwind the 'senderInfo' array. Since $lookup always returns an array,
  // this converts it to an object (or null if no sender found).
  {
    $unwind: {
      path: '$senderInfo',
      preserveNullAndEmptyArrays: true // Keeps the note even if the sender user is not found
    }
  },
  // Stage 4: Add sender's name and profileImage directly to the 'notes.sender' object.
  // Make sure 'name' and 'profileImage' match your User model's field names.
  {
    $addFields: {
      'notes.sender.name': '$senderInfo.name',
      'notes.sender.profileImage': '$senderInfo.profileImage'
    }
  },
  // Stage 5: Remove the temporary 'senderInfo' field as its data has been moved.
  {
    $project: {
      senderInfo: 0
    }
  },
  // Stage 6: Group documents back by the original pickup request '_id' to reconstruct the 'notes' array.
  // We use '$first' with '$$ROOT' to capture the original document's fields (before notes were unwound),
  // and then '$push' all the processed notes back into an array.
  {
    $group: {
      _id: '$_id', // Group by the original pickup request ID
      // Capture the first instance of the original document (before notes unwind)
      originalDoc: { $first: '$$ROOT' },
      // Push all the processed notes (with populated sender info) back into an array
      notes: { $push: '$notes' }
    }
  },
  // Stage 7: Replace the original 'notes' array within 'originalDoc' with our new, populated 'notes' array.
  {
    $addFields: {
      'originalDoc.notes': '$notes'
    }
  },
  // Stage 8: Promote the 'originalDoc' to be the new root document for the output.
  // This effectively reconstructs the pickup request document with its notes array now populated.
  {
    $replaceRoot: {
      newRoot: '$originalDoc'
    }
  }
];


/**
 * Gets all unassigned pickups with distance from company, including submitting user's name
 * and populated sender details in notes.
 * @param {[Number, Number]} companyCoords - [longitude, latitude]
 */
const getUnassignedPickupsWithDistance = async (companyCoords) => {
  try {
    const pickups = await PickupRequest.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: companyCoords
          },
          distanceField: 'distanceFromCompany',
          spherical: true,
          query: {
            assignedTo: null // Only unassigned pickups
          }
        }
      },
      // Add stages to get the main user details for the pickup request
      ...lookupMainUserStages,
      // Add stages to populate sender details within the notes array
      ...populateNotesSenderStages
    ]);

    return pickups;
  } catch (err) {
    console.error('Error in geoNear unassigned:', err);
    throw err;
  }
};

/**
 * Gets all assigned pickups with distance from company, including submitting user's name
 * and populated sender details in notes.
 * @param {[Number, Number]} companyCoords - [longitude, latitude]
 * @param {string} userIdString - The string representation of the ObjectId of the assigned user (company user).
 */
const getAssignedPickupsWithDistance = async (companyCoords, userIdString) => {
  console.log("\n--- Debugging getAssignedPickupsWithDistance ---");
  console.log("Received companyCoords:", companyCoords);
  console.log("Received userIdString:", userIdString);
  console.log("Type of userIdString:", typeof userIdString);
  console.log("Is userIdString a valid ObjectId format?", mongoose.Types.ObjectId.isValid(userIdString));

  try {
    if (!mongoose.Types.ObjectId.isValid(userIdString)) {
      console.error("Invalid userIdString provided to getAssignedPickupsWithDistance:", userIdString);
      return [];
    }

    const userIdObjectId = new mongoose.Types.ObjectId(userIdString);

    const pickups = await PickupRequest.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: companyCoords
          },
          distanceField: 'distanceFromCompany',
          spherical: true,
          query: {
            assignedTo: userIdObjectId // Filter by the specific assigned user ID
          }
        }
      },
      // Add stages to get the main user details for the pickup request
      ...lookupMainUserStages,
      // Add stages to populate sender details within the notes array
      ...populateNotesSenderStages
    ]);

    console.log("Aggregation result for assigned pickups:", pickups);
    return pickups;
  } catch (err) {
    console.error('Error in geoNear assigned pickups:', err);
    throw err;
  }
};

module.exports = {
  getUnassignedPickupsWithDistance,
  getAssignedPickupsWithDistance
};
