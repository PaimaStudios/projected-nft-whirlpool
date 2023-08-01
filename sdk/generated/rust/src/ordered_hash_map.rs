use core::hash::Hash;

#[derive(Clone, Debug, Default, Hash, Ord, Eq, PartialEq, PartialOrd)]
pub struct OrderedHashMap<K, V>(linked_hash_map::LinkedHashMap<K, V>)
where
    K: Hash + Eq + Ord;

impl<K, V> std::ops::Deref for OrderedHashMap<K, V>
where
    K: Hash + Eq + Ord,
{
    type Target = linked_hash_map::LinkedHashMap<K, V>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl<K, V> std::ops::DerefMut for OrderedHashMap<K, V>
where
    K: Hash + Eq + Ord,
{
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl<K, V> OrderedHashMap<K, V>
where
    K: Hash + Eq + Ord,
{
    pub fn new() -> Self {
        Self(linked_hash_map::LinkedHashMap::new())
    }
}

impl<K, V> serde::Serialize for OrderedHashMap<K, V>
where
    K: Hash + Eq + Ord + serde::Serialize,
    V: serde::Serialize,
{
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let map = self.iter().collect::<std::collections::BTreeMap<_, _>>();
        map.serialize(serializer)
    }
}

impl<'de, K, V> serde::de::Deserialize<'de> for OrderedHashMap<K, V>
where
    K: Hash + Eq + Ord + serde::Deserialize<'de>,
    V: serde::Deserialize<'de>,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::de::Deserializer<'de>,
    {
        let map = <std::collections::BTreeMap<_, _> as serde::de::Deserialize>::deserialize(
            deserializer,
        )?;
        Ok(Self(map.into_iter().collect()))
    }
}
