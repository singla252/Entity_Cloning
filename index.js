const fs = require('fs')
const filename = process.argv[2];
const util = require('util');

// Convert fs.readFile into Promise version of same    
const readFile = util.promisify(fs.readFile);


//Function constructor for entity
function Entity(id, name, description) {
	this.entity_id = id;
	this.name = name;
	if (description != undefined) {
		this.description = description
	}
}

//Function constructor for the Link
function Link(from, to) {
	this.from = from;
	this.to = to;
}

//Function constructor for the Mapping between new and old entity
function EntityMap(oldEntityId, clonedEntityId) {
	this.old = oldEntityId;
	this.cloned = clonedEntityId;

}

//Function to get index of entity
const getEntityIndex = (entities, entityId, field) => {
	return entities.findIndex(function (el) {
		return el[field] == entityId;
	});

}

//Function to new entityid by adding 1 to the the maximum
const getNewEntityId = (entities) => {
	return Math.max.apply(Math, entities.map(function (o) { return o.entity_id; })) + 1
}


const cloneEntities = async () => {
	//Check if filename and entityId are provided
	if (process.argv.length < 4) {
		console.log("Please enter filename and entityId");
		process.exit(1);
	}
	else {
		const filename = process.argv[2];
		let entityId = process.argv[3];
		try {
			const fileData = await readFile(filename, "utf-8");
			const data = JSON.parse(fileData);
			let entities = data.entities;
			let links = data.links;
			//Check if both links and entities are present in the json object
			if( !entities || !links)
			{
				console.log('The file does not contain links or entities')
				return;
			}
			let entityIndex = getEntityIndex(data.entities, entityId, 'entity_id')
			//Check if the entity to be cloned exists
			if (entityIndex == -1) {
				console.log("This enityId does not exist");
				return;
			}
			else {
				//Start cloning the first entity
				let newEntityId = getNewEntityId(entities);
				let oldEntity = entities[entityIndex];
				let map = []
				let newLinks = []
				let newEntity = new Entity(newEntityId, oldEntity.name, oldEntity.description);
				entities.push(newEntity);
				//Push the mapping to the map array
				map.push(new EntityMap(oldEntity.entity_id, newEntityId))
				//Add the from connections to the newly cloned entity
				links.forEach((l) => {
					if (l.to == oldEntity.entity_id) {
						newLinks.push(new Link(l.from, newEntityId));
					}
				})
				//Clone the To entities and add the links
				for (i = 0; i < map.length; i++) {
					links.forEach((l) => {
						if (l.from == map[i].old) {
							entityId = l.to;
							let mapIndexTo = getEntityIndex(map, entityId, 'old')
							//Check if there is a cycle just add the link and don't clone again
							if (mapIndexTo == -1) {
								entityIndex = getEntityIndex(data.entities, entityId, 'entity_id');
								newEntityId = getNewEntityId(entities);
								oldEntity = entities[entityIndex];
								newEntity = new Entity(newEntityId, oldEntity.name, oldEntity.description);
								entities.push(newEntity);
								map.push(new EntityMap(oldEntity.entity_id, newEntityId));
								newLinks.push(new Link(map[i].cloned, newEntityId));
							}
							else {
                                //console.log(map[i].new,)
								newLinks.push(new Link(map[i].cloned, map[mapIndexTo].cloned));
							}
						}
					})
				}
				links = JSON.stringify(links.concat(newLinks));
				entities = JSON.stringify(entities);
				result={entities,links}
				console.log(result);
				return(result)

			}
		}
		catch (ex) {
			console.log(ex.message)
		}
	}

}

cloneEntities()

